import { rateLimit } from "express-rate-limit"

// Rate limiter general para la API
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana de tiempo
  message: {
    error: "Demasiadas solicitudes",
    message: "Ha excedido el límite de solicitudes. Intente nuevamente en 15 minutos.",
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Rate limiter más estricto para operaciones de escritura
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20, // máximo 20 requests por ventana de tiempo
  message: {
    error: "Demasiadas solicitudes de escritura",
    message: "Ha excedido el límite de operaciones de escritura. Intente nuevamente en 15 minutos.",
  },
  standardHeaders: true,
  legacyHeaders: false,
})
