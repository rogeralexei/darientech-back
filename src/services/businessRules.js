import { Reservation, Space } from "../models/index.js"
import { Op } from "sequelize"
import moment from "moment"

export class BusinessRules {
  // Regla 1: No deben existir conflictos de horarios para el mismo Espacio
  static async validateTimeSlotConflict(espacioId, fechaReserva, horaInicio, horaFin, excludeReservationId = null) {
    const whereClause = {
      espacioId,
      fechaReserva,
      estado: "activa",
      [Op.or]: [
        {
          horaInicio: { [Op.lt]: horaFin },
          horaFin: { [Op.gt]: horaInicio },
        },
      ],
    }

    // Excluir la reserva actual si se está actualizando
    if (excludeReservationId) {
      whereClause.id = { [Op.ne]: excludeReservationId }
    }

    const conflictingReservation = await Reservation.findOne({ where: whereClause })

    if (conflictingReservation) {
      throw new Error(
        `Conflicto de horario detectado. Ya existe una reserva activa en el espacio ${espacioId} el ${fechaReserva} de ${conflictingReservation.horaInicio} a ${conflictingReservation.horaFin}`,
      )
    }

    return true
  }

  // Regla 2: Máximo 3 reservas activas por semana por cliente
  static async validateWeeklyReservationLimit(emailCliente, fechaReserva, excludeReservationId = null) {
    const maxReservationsPerWeek = Number.parseInt(process.env.MAX_RESERVATIONS_PER_WEEK) || 3

    // Calcular inicio y fin de la semana
    const startOfWeek = moment(fechaReserva).startOf("week").format("YYYY-MM-DD")
    const endOfWeek = moment(fechaReserva).endOf("week").format("YYYY-MM-DD")

    const whereClause = {
      emailCliente,
      fechaReserva: {
        [Op.between]: [startOfWeek, endOfWeek],
      },
      estado: "activa",
    }

    // Excluir la reserva actual si se está actualizando
    if (excludeReservationId) {
      whereClause.id = { [Op.ne]: excludeReservationId }
    }

    const clientReservationsThisWeek = await Reservation.count({ where: whereClause })

    if (clientReservationsThisWeek >= maxReservationsPerWeek) {
      throw new Error(
        `El cliente ${emailCliente} ha alcanzado el límite de ${maxReservationsPerWeek} reservas activas por semana (${startOfWeek} a ${endOfWeek}). Reservas actuales: ${clientReservationsThisWeek}`,
      )
    }

    return true
  }

  // Regla 3: El espacio debe estar activo para poder ser reservado
  static async validateSpaceAvailability(espacioId) {
    const space = await Space.findByPk(espacioId)

    if (!space) {
      throw new Error(`El espacio con ID ${espacioId} no existe`)
    }

    if (!space.activo) {
      throw new Error(`El espacio '${space.nombre}' no está disponible para reservas`)
    }

    return space
  }

  // Regla 4: La fecha de reserva debe ser futura
  static validateFutureDate(fechaReserva) {
    const today = moment().format("YYYY-MM-DD")
    const reservationDate = moment(fechaReserva).format("YYYY-MM-DD")

    if (reservationDate < today) {
      throw new Error(`La fecha de reserva (${fechaReserva}) debe ser futura. Fecha actual: ${today}`)
    }

    return true
  }

  // Regla 5: La hora de fin debe ser posterior a la hora de inicio
  static validateTimeRange(horaInicio, horaFin) {
    if (horaInicio >= horaFin) {
      throw new Error(`La hora de fin (${horaFin}) debe ser posterior a la hora de inicio (${horaInicio})`)
    }

    return true
  }

  // Regla 6: Horario de operación del coworking (8:00 - 22:00)
  static validateOperatingHours(horaInicio, horaFin) {
    const openingTime = "08:00"
    const closingTime = "22:00"

    if (horaInicio < openingTime || horaFin > closingTime) {
      throw new Error(`Las reservas solo pueden realizarse en horario de operación: ${openingTime} a ${closingTime}`)
    }

    return true
  }

  // Regla 7: Duración mínima y máxima de reserva
  static validateReservationDuration(horaInicio, horaFin) {
    const inicio = moment(`2000-01-01T${horaInicio}`)
    const fin = moment(`2000-01-01T${horaFin}`)
    const durationHours = fin.diff(inicio, "hours", true)

    const minDuration = 0.5 // 30 minutos
    const maxDuration = 8 // 8 horas

    if (durationHours < minDuration) {
      throw new Error(`La duración mínima de una reserva es ${minDuration} horas (30 minutos)`)
    }

    if (durationHours > maxDuration) {
      throw new Error(`La duración máxima de una reserva es ${maxDuration} horas`)
    }

    return true
  }

  // Regla 8: No permitir reservas con más de 30 días de anticipación
  static validateAdvanceBookingLimit(fechaReserva) {
    const maxAdvanceDays = 30
    const maxDate = moment().add(maxAdvanceDays, "days").format("YYYY-MM-DD")

    if (fechaReserva > maxDate) {
      throw new Error(
        `No se pueden realizar reservas con más de ${maxAdvanceDays} días de anticipación. Fecha límite: ${maxDate}`,
      )
    }

    return true
  }

  // Regla 9: Validar formato de email
  static validateEmailFormat(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error(`El formato del email '${email}' no es válido`)
    }

    return true
  }

  // Regla 10: No permitir modificar reservas que comienzan en menos de 2 horas
  static validateModificationTimeLimit(reservation) {
    const now = moment()
    const reservationStart = moment(`${reservation.fechaReserva} ${reservation.horaInicio}`)
    const hoursUntilStart = reservationStart.diff(now, "hours", true)

    const minHoursForModification = 2

    if (hoursUntilStart < minHoursForModification) {
      throw new Error(`No se puede modificar una reserva que comienza en menos de ${minHoursForModification} horas`)
    }

    return true
  }

  // Método principal para validar una nueva reserva
  static async validateNewReservation(reservationData) {
    const { espacioId, emailCliente, fechaReserva, horaInicio, horaFin } = reservationData

    // Ejecutar todas las validaciones
    this.validateEmailFormat(emailCliente)
    this.validateFutureDate(fechaReserva)
    this.validateTimeRange(horaInicio, horaFin)
    this.validateOperatingHours(horaInicio, horaFin)
    this.validateReservationDuration(horaInicio, horaFin)
    this.validateAdvanceBookingLimit(fechaReserva)

    // Validaciones que requieren consultas a la base de datos
    await this.validateSpaceAvailability(espacioId)
    await this.validateTimeSlotConflict(espacioId, fechaReserva, horaInicio, horaFin)
    await this.validateWeeklyReservationLimit(emailCliente, fechaReserva)

    return true
  }

  // Método para validar actualización de reserva
  static async validateReservationUpdate(reservationId, updateData, currentReservation) {
    // Validar tiempo límite para modificación
    this.validateModificationTimeLimit(currentReservation)

    // Si se actualizan fecha u horarios, validar nuevamente
    if (updateData.fechaReserva || updateData.horaInicio || updateData.horaFin) {
      const newFecha = updateData.fechaReserva || currentReservation.fechaReserva
      const newHoraInicio = updateData.horaInicio || currentReservation.horaInicio
      const newHoraFin = updateData.horaFin || currentReservation.horaFin

      this.validateFutureDate(newFecha)
      this.validateTimeRange(newHoraInicio, newHoraFin)
      this.validateOperatingHours(newHoraInicio, newHoraFin)
      this.validateReservationDuration(newHoraInicio, newHoraFin)
      this.validateAdvanceBookingLimit(newFecha)

      // Validar conflictos excluyendo la reserva actual
      await this.validateTimeSlotConflict(
        currentReservation.espacioId,
        newFecha,
        newHoraInicio,
        newHoraFin,
        reservationId,
      )
    }

    return true
  }

  // Obtener resumen de reglas de negocio
  static getBusinessRulesSummary() {
    return {
      reservas: {
        limitePorSemana: Number.parseInt(process.env.MAX_RESERVATIONS_PER_WEEK) || 3,
        duracionMinima: "30 minutos",
        duracionMaxima: "8 horas",
        anticipacionMaxima: "30 días",
        tiempoMinimoParaModificar: "2 horas",
      },
      horarios: {
        apertura: "08:00",
        cierre: "22:00",
        diasOperacion: "Lunes a Domingo",
      },
      espacios: {
        requiereEstarActivo: true,
        noConflictosDeHorario: true,
      },
      clientes: {
        emailRequerido: true,
        formatoEmailValido: true,
      },
    }
  }
}
