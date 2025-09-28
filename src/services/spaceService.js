import { Space, Reservation } from "../models/index.js"
import { Op } from "sequelize"

export class SpaceService {
  // Obtener espacios disponibles en un rango de fechas
  static async getAvailableSpaces(fechaInicio, fechaFin, horaInicio, horaFin, capacidadMinima = 1) {
    const spaces = await Space.findAll({
      where: {
        activo: true,
        capacidad: { [Op.gte]: capacidadMinima },
      },
      include: [
        {
          model: Reservation,
          as: "reservas",
          where: {
            fechaReserva: {
              [Op.between]: [fechaInicio, fechaFin],
            },
            estado: "activa",
            [Op.or]: [
              {
                horaInicio: { [Op.lt]: horaFin },
                horaFin: { [Op.gt]: horaInicio },
              },
            ],
          },
          required: false,
        },
      ],
    })

    // Filtrar espacios que no tienen conflictos
    return spaces.filter((space) => !space.reservas || space.reservas.length === 0)
  }

  // Obtener estadísticas de uso de un espacio
  static async getSpaceUsageStats(spaceId, fechaInicio, fechaFin) {
    const space = await Space.findByPk(spaceId)
    if (!space) {
      throw new Error("Espacio no encontrado")
    }

    const reservations = await Reservation.findAll({
      where: {
        espacioId: spaceId,
        fechaReserva: {
          [Op.between]: [fechaInicio, fechaFin],
        },
      },
    })

    const totalReservations = reservations.length
    const activeReservations = reservations.filter((r) => r.estado === "activa").length
    const completedReservations = reservations.filter((r) => r.estado === "completada").length
    const cancelledReservations = reservations.filter((r) => r.estado === "cancelada").length

    // Calcular horas totales reservadas
    const totalHours = reservations.reduce((total, reservation) => {
      const inicio = new Date(`2000-01-01T${reservation.horaInicio}`)
      const fin = new Date(`2000-01-01T${reservation.horaFin}`)
      return total + (fin - inicio) / (1000 * 60 * 60)
    }, 0)

    return {
      espacio: {
        id: space.id,
        nombre: space.nombre,
        capacidad: space.capacidad,
      },
      periodo: { fechaInicio, fechaFin },
      estadisticas: {
        totalReservations,
        activeReservations,
        completedReservations,
        cancelledReservations,
        totalHours,
        averageHoursPerReservation: totalReservations > 0 ? totalHours / totalReservations : 0,
      },
    }
  }

  // Obtener los horarios más populares de un espacio
  static async getPopularTimeSlots(spaceId, fechaInicio, fechaFin) {
    const reservations = await Reservation.findAll({
      where: {
        espacioId: spaceId,
        fechaReserva: {
          [Op.between]: [fechaInicio, fechaFin],
        },
        estado: { [Op.in]: ["activa", "completada"] },
      },
      attributes: ["horaInicio", "horaFin"],
    })

    // Agrupar por hora de inicio
    const timeSlots = {}
    reservations.forEach((reservation) => {
      const hora = reservation.horaInicio
      timeSlots[hora] = (timeSlots[hora] || 0) + 1
    })

    // Ordenar por popularidad
    return Object.entries(timeSlots)
      .map(([hora, count]) => ({ hora, reservas: count }))
      .sort((a, b) => b.reservas - a.reservas)
  }
}
