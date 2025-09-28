// Middleware para validar parámetros de ID
export const validateId = (paramName = "id") => {
  return (req, res, next) => {
    const id = req.params[paramName]

    if (!id || isNaN(Number.parseInt(id)) || Number.parseInt(id) <= 0) {
      return res.status(400).json({
        error: "ID inválido",
        message: `El parámetro ${paramName} debe ser un número entero positivo`,
      })
    }

    req.params[paramName] = Number.parseInt(id)
    next()
  }
}

// Middleware para validar esquemas de Joi
export const validateSchema = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false })

    if (error) {
      return res.status(400).json({
        error: "Error de validación",
        message: "Los datos proporcionados no son válidos",
        details: error.details.map((detail) => ({
          field: detail.path.join("."),
          message: detail.message,
        })),
      })
    }

    req.body = value
    next()
  }
}

// Middleware para validar query parameters de paginación
export const validatePagination = (req, res, next) => {
  const { page = 1, limit = 10 } = req.query

  const pageNum = Number.parseInt(page)
  const limitNum = Number.parseInt(limit)

  if (isNaN(pageNum) || pageNum < 1) {
    return res.status(400).json({
      error: "Parámetro de página inválido",
      message: "El parámetro 'page' debe ser un número entero mayor a 0",
    })
  }

  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    return res.status(400).json({
      error: "Parámetro de límite inválido",
      message: "El parámetro 'limit' debe ser un número entre 1 y 100",
    })
  }

  req.pagination = {
    page: pageNum,
    limit: limitNum,
    offset: (pageNum - 1) * limitNum,
  }

  next()
}
