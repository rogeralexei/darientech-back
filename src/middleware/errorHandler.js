export const errorHandler = (err, req, res, next) => {
  console.error("Error:", err)

  // Error de validación de Joi
  if (err.isJoi) {
    return res.status(400).json({
      error: "Error de validación",
      message: err.details[0].message,
      details: err.details,
    })
  }

  // Error de Sequelize
  if (err.name === "SequelizeValidationError") {
    return res.status(400).json({
      error: "Error de validación de datos",
      message: err.errors[0].message,
      details: err.errors,
    })
  }

  if (err.name === "SequelizeUniqueConstraintError") {
    return res.status(409).json({
      error: "Conflicto de datos",
      message: "Ya existe un registro con estos datos",
      details: err.errors,
    })
  }

  // Error genérico
  res.status(err.status || 500).json({
    error: err.message || "Error interno del servidor",
    message: "Ha ocurrido un error inesperado",
  })
}
