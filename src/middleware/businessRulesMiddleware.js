import { BusinessRules } from "../services/businessRules.js"
import { ApiResponse } from "../utils/apiResponse.js"

// Middleware para validar reglas de negocio en creación de reservas
export const validateNewReservationRules = async (req, res, next) => {
  try {
    await BusinessRules.validateNewReservation(req.body)
    next()
  } catch (error) {
    return res.status(400).json(
      ApiResponse.error("Violación de reglas de negocio", 400, {
        regla: error.message,
        datos: req.body,
      }),
    )
  }
}

// Middleware para validar reglas de negocio en actualización de reservas
export const validateUpdateReservationRules = async (req, res, next) => {
  try {
    // Obtener la reserva actual (debe estar disponible en req.reservation)
    if (!req.reservation) {
      return res.status(500).json(ApiResponse.error("Error interno: reserva no encontrada en el contexto", 500))
    }

    await BusinessRules.validateReservationUpdate(req.params.id, req.body, req.reservation)
    next()
  } catch (error) {
    return res.status(400).json(
      ApiResponse.error("Violación de reglas de negocio", 400, {
        regla: error.message,
        datos: req.body,
      }),
    )
  }
}

// Middleware para cargar reserva en el contexto (para validaciones de actualización)
export const loadReservationContext = async (req, res, next) => {
  try {
    const { Reservation } = await import("../models/index.js")
    const reservation = await Reservation.findByPk(req.params.id)

    if (!reservation) {
      return res.status(404).json(ApiResponse.error("Reserva no encontrada", 404))
    }

    req.reservation = reservation
    next()
  } catch (error) {
    return res.status(500).json(ApiResponse.error("Error al cargar contexto de reserva", 500))
  }
}
