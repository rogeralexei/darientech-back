import { Reservation, Space } from "../models/index.js"
import { Op } from "sequelize"
import moment from "moment"

export class ReservationService {
  // Obtener estadísticas de reservas por período
  static async getReservationStats(fechaInicio, fechaFin) {
    const reservations = await Reservation.findAll({
      where: {
        fechaReserva: {
          [Op.between]: [fechaInicio, fechaFin],
        },
      },
      include: [
        {
          model: Space,
          as: "espacio",
          attributes: ["id", "nombre"],
        },
      ],
    })

    const totalReservations = reservations.length
    const activeReservations = reservations.filter((r) => r.estado === "activa").length
    const completedReservations = reservations.filter((r) => r.estado === "completada").length
    const cancelledReservations = reservations.filter((r) => r.estado === "cancelada").length

    // Estadísticas por espacio
    const spaceStats = {}
    reservations.forEach((reservation) => {
      const spaceId = reservation.espacioId
      if (!spaceStats[spaceId]) {
        spaceStats[spaceId] = {
          espacio: reservation.espacio,
          total: 0,
          activas: 0,
          completadas: 0,
          canceladas: 0,
        }
      }
      spaceStats[spaceId].total++
      spaceStats[spaceId][
        reservation.estado === "activa" ? "activas" : reservation.estado === "completada" ? "completadas" : "canceladas"
      ]++
    })

    // Clientes más activos
    const clientStats = {}
    reservations.forEach((reservation) => {
      const email = reservation.emailCliente
      clientStats[email] = (clientStats[email] || 0) + 1
    })

    const topClients = Object.entries(clientStats)
      .map(([email, count]) => ({ email, reservas: count }))
      .sort((a, b) => b.reservas - a.reservas)
      .slice(0, 10)

    return {
      periodo: { fechaInicio, fechaFin },
      resumen: {
        totalReservations,
        activeReservations,
        completedReservations,
        cancelledReservations,
        tasaCancelacion: totalReservations > 0 ? ((cancelledReservations / totalReservations) * 100).toFixed(2) : 0,
      },
      espacios: Object.values(spaceStats),
      clientesMasActivos: topClients,
    }
  }

  // Verificar disponibilidad de múltiples espacios
  static async checkMultipleSpacesAvailability(fecha, horaInicio, horaFin, capacidadMinima = 1) {
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
            fechaReserva: fecha,
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

    return spaces.map((space) => ({
      id: space.id,
      nombre: space.nombre,
      ubicacion: space.ubicacion,
      capacidad: space.capacidad,
      disponible: !space.reservas || space.reservas.length === 0,
      conflictos: space.reservas
        ? space.reservas.map((r) => ({
            id: r.id,
            horaInicio: r.horaInicio,
            horaFin: r.horaFin,
          }))
        : [],
    }))
  }

  // Obtener reservas próximas a vencer (para notificaciones)
  static async getUpcomingReservations(horasAnticipacion = 24) {
    const fechaLimite = moment().add(horasAnticipacion, "hours").format("YYYY-MM-DD HH:mm:ss")
    const fechaActual = moment().format("YYYY-MM-DD HH:mm:ss")

    const upcomingReservations = await Reservation.findAll({
      where: {
        estado: "activa",
        // Combinar fecha y hora para comparación
        [Op.and]: [
          {
            [Op.or]: [
              {
                fechaReserva: moment().format("YYYY-MM-DD"),
                horaInicio: { [Op.gte]: moment().format("HH:mm") },
              },
              {
                fechaReserva: { [Op.gt]: moment().format("YYYY-MM-DD") },
              },
            ],
          },
        ],
      },
      include: [
        {
          model: Space,
          as: "espacio",
          attributes: ["id", "nombre", "ubicacion"],
        },
      ],
      order: [
        ["fechaReserva", "ASC"],
        ["horaInicio", "ASC"],
      ],
    })

    // Filtrar por tiempo exacto
    return upcomingReservations.filter((reservation) => {
      const reservationDateTime = moment(`${reservation.fechaReserva} ${reservation.horaInicio}`)
      const now = moment()
      const diffHours = reservationDateTime.diff(now, "hours", true)
      return diffHours > 0 && diffHours <= horasAnticipacion
    })
  }

  // Obtener conflictos de horario para un rango de fechas
  static async getScheduleConflicts(fechaInicio, fechaFin) {
    const reservations = await Reservation.findAll({
      where: {
        fechaReserva: {
          [Op.between]: [fechaInicio, fechaFin],
        },
        estado: "activa",
      },
      include: [
        {
          model: Space,
          as: "espacio",
          attributes: ["id", "nombre"],
        },
      ],
      order: [
        ["fechaReserva", "ASC"],
        ["horaInicio", "ASC"],
      ],
    })

    const conflicts = []
    const spaceSchedules = {}

    reservations.forEach((reservation) => {
      const spaceId = reservation.espacioId
      const fecha = reservation.fechaReserva
      const key = `${spaceId}-${fecha}`

      if (!spaceSchedules[key]) {
        spaceSchedules[key] = []
      }

      // Verificar solapamientos con reservas existentes del mismo día
      const overlapping = spaceSchedules[key].filter((existing) => {
        return reservation.horaInicio < existing.horaFin && reservation.horaFin > existing.horaInicio
      })

      if (overlapping.length > 0) {
        conflicts.push({
          espacio: reservation.espacio,
          fecha: reservation.fechaReserva,
          reservaActual: {
            id: reservation.id,
            emailCliente: reservation.emailCliente,
            horaInicio: reservation.horaInicio,
            horaFin: reservation.horaFin,
          },
          conflictosCon: overlapping.map((r) => ({
            id: r.id,
            emailCliente: r.emailCliente,
            horaInicio: r.horaInicio,
            horaFin: r.horaFin,
          })),
        })
      }

      spaceSchedules[key].push(reservation)
    })

    return conflicts
  }
}
