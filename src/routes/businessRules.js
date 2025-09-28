import express from "express"
import { getBusinessRules, validateReservation } from "../controllers/businessRulesController.js"
import { validateSchema } from "../middleware/validation.js"
import { createReservationSchema } from "../validators/reservationValidator.js"

const router = express.Router()

// GET /api/business-rules - Obtener reglas de negocio
router.get("/", getBusinessRules)

// POST /api/business-rules/validate-reservation - Validar reserva
router.post("/validate-reservation", validateSchema(createReservationSchema), validateReservation)

export default router
