import Joi from "joi"
import moment from "moment"

export const createReservationSchema = Joi.object({
  espacioId: Joi.number().integer().positive().required().messages({
    "number.base": "El ID del espacio debe ser un número",
    "number.integer": "El ID del espacio debe ser un número entero",
    "number.positive": "El ID del espacio debe ser positivo",
    "any.required": "El ID del espacio es requerido",
  }),
  emailCliente: Joi.string().email().required().messages({
    "string.email": "Debe proporcionar un email válido",
    "string.empty": "El email del cliente es requerido",
    "any.required": "El email del cliente es requerido",
  }),
  fechaReserva: Joi.date().iso().min(moment().format("YYYY-MM-DD")).required().messages({
    "date.base": "La fecha de reserva debe ser válida",
    "date.format": "La fecha debe estar en formato ISO (YYYY-MM-DD)",
    "date.min": "La fecha de reserva debe ser futura",
    "any.required": "La fecha de reserva es requerida",
  }),
  horaInicio: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      "string.pattern.base": "La hora de inicio debe tener formato HH:mm",
      "string.empty": "La hora de inicio es requerida",
      "any.required": "La hora de inicio es requerida",
    }),
  horaFin: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      "string.pattern.base": "La hora de fin debe tener formato HH:mm",
      "string.empty": "La hora de fin es requerida",
      "any.required": "La hora de fin es requerida",
    }),
}).custom((value, helpers) => {
  // Validar que la hora de fin sea posterior a la hora de inicio
  if (value.horaInicio >= value.horaFin) {
    return helpers.error("custom.horaFin", {
      message: "La hora de fin debe ser posterior a la hora de inicio",
    })
  }
  return value
})

export const updateReservationSchema = Joi.object({
  fechaReserva: Joi.date().iso().min(moment().format("YYYY-MM-DD")).optional(),
  horaInicio: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional(),
  horaFin: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional(),
  estado: Joi.string().valid("activa", "cancelada", "completada").optional(),
}).custom((value, helpers) => {
  if (value.horaInicio && value.horaFin && value.horaInicio >= value.horaFin) {
    return helpers.error("custom.horaFin", {
      message: "La hora de fin debe ser posterior a la hora de inicio",
    })
  }
  return value
})
