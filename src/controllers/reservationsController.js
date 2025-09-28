import { Reservation, Space } from "../models/index.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Op } from "sequelize"
import { BusinessRules } from "../services/businessRules.js"

// GET /api/reservations - Obtener todas las reservas con paginación
export const getAllReservations = asyncHandler(async (req, res) => {
  const { page, limit, offset } = req.pagination
  const { emailCliente, espacioId, fecha, estado, fechaInicio, fechaFin } = req.query

  // Construir filtros dinámicos
  const whereClause = {}

  if (emailCliente) {
    whereClause.emailCliente = { [Op.iLike]: `%${emailCliente}%` }
  }

  if (espacioId) {
    whereClause.espacioId = Number.parseInt(espacioId)
  }

  if (fecha) {
    whereClause.fechaReserva = fecha
  }

  if (fechaInicio && fechaFin) {
    whereClause.fechaReserva = {
      [Op.between]: [fechaInicio, fechaFin],
    }
  } else if (fechaInicio) {
    whereClause.fechaReserva = { [Op.gte]: fechaInicio }
  } else if (fechaFin) {
    whereClause.fechaReserva = { [Op.lte]: fechaFin }
  }

  if (estado) {
    whereClause.estado = estado
  }

  const { count, rows } = await Reservation.findAndCountAll({
    where: whereClause,
    limit,
    offset,
    order: [
      ["fechaReserva", "DESC"],
      ["horaInicio", "ASC"],
    ],
    include: [
      {
        model: Space,
        as: "espacio",
        attributes: ["id", "nombre", "ubicacion", "capacidad"],
      },
    ],
  })

  res.json(ApiResponse.paginated(rows, { page, limit, total: count }, `Se encontraron ${count} reservas`))
})

// GET /api/reservations/:id - Obtener una reserva específica
export const getReservationById = asyncHandler(async (req, res) => {
  const { id } = req.params

  const reservation = await Reservation.findByPk(id, {
    include: [
      {
        model: Space,
        as: "espacio",
        attributes: ["id", "nombre", "ubicacion", "capacidad", "descripcion"],
      },
    ],
  })

  if (!reservation) {
    return res.status(404).json(ApiResponse.error("Reserva no encontrada", 404))
  }

  res.json(ApiResponse.success(reservation, "Reserva obtenida exitosamente"))
})

// POST /api/reservations - Crear una nueva reserva
export const createReservation = asyncHandler(async (req, res) => {
  const reservationData = req.body

  try {
    await BusinessRules.validateNewReservation(reservationData)
  } catch (error) {
    return res.status(400).json(
      ApiResponse.error("Violación de reglas de negocio", 400, {
        regla: error.message,
      }),
    )
  }

  const newReservation = await Reservation.create(reservationData)

  // Incluir información del espacio en la respuesta
  const reservationWithSpace = await Reservation.findByPk(newReservation.id, {
    include: [
      {
        model: Space,
        as: "espacio",
        attributes: ["id", "nombre", "ubicacion", "capacidad"],
      },
    ],
  })

  res.status(201).json(ApiResponse.success(reservationWithSpace, "Reserva creada exitosamente", 201))
})

// PUT /api/reservations/:id - Actualizar una reserva
export const updateReservation = asyncHandler(async (req, res) => {
  const { id } = req.params
  const updateData = req.body

  const reservation = await Reservation.findByPk(id)

  if (!reservation) {
    return res.status(404).json(ApiResponse.error("Reserva no encontrada", 404))
  }

  // No permitir actualizar reservas completadas o canceladas
  if (reservation.estado !== "activa") {
    return res
      .status(400)
      .json(ApiResponse.error(`No se puede modificar una reserva en estado '${reservation.estado}'`, 400))
  }

  try {
    await BusinessRules.validateReservationUpdate(id, updateData, reservation)
  } catch (error) {
    return res.status(400).json(
      ApiResponse.error("Violación de reglas de negocio", 400, {
        regla: error.message,
      }),
    )
  }

  await reservation.update(updateData)

  // Incluir información del espacio en la respuesta
  const updatedReservation = await Reservation.findByPk(id, {
    include: [
      {
        model: Space,
        as: "espacio",
        attributes: ["id", "nombre", "ubicacion", "capacidad"],
      },
    ],
  })

  res.json(ApiResponse.success(updatedReservation, "Reserva actualizada exitosamente"))
})

// DELETE /api/reservations/:id - Eliminar una reserva
export const deleteReservation = asyncHandler(async (req, res) => {
  const { id } = req.params

  const reservation = await Reservation.findByPk(id)

  if (!reservation) {
    return res.status(404).json(ApiResponse.error("Reserva no encontrada", 404))
  }

  await reservation.destroy()

  res.json(ApiResponse.success(null, "Reserva eliminada exitosamente"))
})

// PATCH /api/reservations/:id/cancel - Cancelar una reserva
export const cancelReservation = asyncHandler(async (req, res) => {
  const { id } = req.params

  const reservation = await Reservation.findByPk(id)

  if (!reservation) {
    return res.status(404).json(ApiResponse.error("Reserva no encontrada", 404))
  }

  if (reservation.estado !== "activa") {
    return res
      .status(400)
      .json(ApiResponse.error(`No se puede cancelar una reserva en estado '${reservation.estado}'`, 400))
  }

  await reservation.update({ estado: "cancelada" })

  res.json(ApiResponse.success(reservation, "Reserva cancelada exitosamente"))
})

// PATCH /api/reservations/:id/complete - Marcar reserva como completada
export const completeReservation = asyncHandler(async (req, res) => {
  const { id } = req.params

  const reservation = await Reservation.findByPk(id)

  if (!reservation) {
    return res.status(404).json(ApiResponse.error("Reserva no encontrada", 404))
  }

  if (reservation.estado !== "activa") {
    return res
      .status(400)
      .json(ApiResponse.error(`No se puede completar una reserva en estado '${reservation.estado}'`, 400))
  }

  await reservation.update({ estado: "completada" })

  res.json(ApiResponse.success(reservation, "Reserva marcada como completada"))
})

// GET /api/reservations/client/:email - Obtener reservas de un cliente específico
export const getReservationsByClient = asyncHandler(async (req, res) => {
  const { email } = req.params
  const { page, limit, offset } = req.pagination
  const { estado, fechaInicio, fechaFin } = req.query

  const whereClause = { emailCliente: email }

  if (estado) {
    whereClause.estado = estado
  }

  if (fechaInicio && fechaFin) {
    whereClause.fechaReserva = {
      [Op.between]: [fechaInicio, fechaFin],
    }
  }

  const { count, rows } = await Reservation.findAndCountAll({
    where: whereClause,
    limit,
    offset,
    order: [
      ["fechaReserva", "DESC"],
      ["horaInicio", "ASC"],
    ],
    include: [
      {
        model: Space,
        as: "espacio",
        attributes: ["id", "nombre", "ubicacion", "capacidad"],
      },
    ],
  })

  res.json(ApiResponse.paginated(rows, { page, limit, total: count }, `Se encontraron ${count} reservas para ${email}`))
})
