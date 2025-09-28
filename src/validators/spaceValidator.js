import Joi from "joi"

export const createSpaceSchema = Joi.object({
  nombre: Joi.string().min(2).max(100).required().messages({
    "string.empty": "El nombre del espacio es requerido",
    "string.min": "El nombre debe tener al menos 2 caracteres",
    "string.max": "El nombre no puede exceder 100 caracteres",
    "any.required": "El nombre del espacio es requerido",
  }),
  ubicacion: Joi.string().min(2).max(200).required().messages({
    "string.empty": "La ubicación es requerida",
    "string.min": "La ubicación debe tener al menos 2 caracteres",
    "string.max": "La ubicación no puede exceder 200 caracteres",
    "any.required": "La ubicación es requerida",
  }),
  capacidad: Joi.number().integer().min(1).max(100).required().messages({
    "number.base": "La capacidad debe ser un número",
    "number.integer": "La capacidad debe ser un número entero",
    "number.min": "La capacidad debe ser al menos 1 persona",
    "number.max": "La capacidad no puede exceder 100 personas",
    "any.required": "La capacidad es requerida",
  }),
  descripcion: Joi.string().max(500).allow("").optional().messages({
    "string.max": "La descripción no puede exceder 500 caracteres",
  }),
})

export const updateSpaceSchema = Joi.object({
  nombre: Joi.string().min(2).max(100).optional(),
  ubicacion: Joi.string().min(2).max(200).optional(),
  capacidad: Joi.number().integer().min(1).max(100).optional(),
  descripcion: Joi.string().max(500).allow("").optional(),
  activo: Joi.boolean().optional(),
})
