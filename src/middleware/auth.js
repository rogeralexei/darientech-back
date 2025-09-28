export const authMiddleware = (req, res, next) => {
  const apiKey = req.headers["x-api-key"]
  const validApiKey = process.env.API_KEY || "coworking-api-key-2024"

  if (!apiKey) {
    return res.status(401).json({
      error: "API key requerida",
      message: "Debe proporcionar una API key válida en el header x-api-key",
    })
  }

  if (apiKey !== validApiKey) {
    return res.status(403).json({
      error: "API key inválida",
      message: "La API key proporcionada no es válida",
    })
  }

  next()
}
