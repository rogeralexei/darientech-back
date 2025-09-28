import { BusinessRules } from "../services/businessRules.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

// GET /api/business-rules - Obtener resumen de reglas de negocio
export const getBusinessRules = asyncHandler(async (req, res) => {
  const rules = BusinessRules.getBusinessRulesSummary()
  res.json(ApiResponse.success(rules, "Reglas de negocio obtenidas exitosamente"))
})

// POST /api/business-rules/validate-reservation - Validar una reserva sin crearla
export const validateReservation = asyncHandler(async (req, res) => {
  try {
    await BusinessRules.validateNewReservation(req.body)
    res.json(
      ApiResponse.success({ valida: true, datos: req.body }, "La reserva cumple con todas las reglas de negocio"),
    )
  } catch (error) {
    res.status(400).json(
      ApiResponse.error("La reserva no cumple con las reglas de negocio", 400, {
        valida: false,
        reglaViolada: error.message,
        datos: req.body,
      }),
    )
  }
})
