import express from "express"
import {
  getAllReservations,
  getReservationById,
  createReservation,
  updateReservation,
  deleteReservation,
  cancelReservation,
  completeReservation,
  getReservationsByClient,
} from "../controllers/reservationsController.js"
import { validateId, validateSchema, validatePagination } from "../middleware/validation.js"
import { createReservationSchema, updateReservationSchema } from "../validators/reservationValidator.js"
import { strictLimiter } from "../middleware/rateLimiter.js"

const router = express.Router()

// GET /api/reservations - Obtener todas las reservas
router.get("/", validatePagination, getAllReservations)

// GET /api/reservations/client/:email - Obtener reservas de un cliente
router.get("/client/:email", validatePagination, getReservationsByClient)

// GET /api/reservations/:id - Obtener una reserva específica
router.get("/:id", validateId(), getReservationById)

// POST /api/reservations - Crear una nueva reserva
router.post("/", strictLimiter, validateSchema(createReservationSchema), createReservation)

// PUT /api/reservations/:id - Actualizar una reserva
router.put("/:id", strictLimiter, validateId(), validateSchema(updateReservationSchema), updateReservation)

// PATCH /api/reservations/:id/cancel - Cancelar una reserva
router.patch("/:id/cancel", strictLimiter, validateId(), cancelReservation)

// PATCH /api/reservations/:id/complete - Completar una reserva
router.patch("/:id/complete", strictLimiter, validateId(), completeReservation)

// DELETE /api/reservations/:id - Eliminar una reserva
router.delete("/:id", strictLimiter, validateId(), deleteReservation)

export default router
