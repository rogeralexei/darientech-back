import express from "express"
import cors from "cors"
import helmet from "helmet"
import dotenv from "dotenv"
import { sequelize } from "./config/database.js"
import { authMiddleware } from "./middleware/auth.js"
import { errorHandler } from "./middleware/errorHandler.js"
import spacesRoutes from "./routes/spaces.js"
import reservationsRoutes from "./routes/reservations.js"
import businessRulesRoutes from "./routes/businessRules.js"
import { apiLimiter } from "./middleware/rateLimiter.js"
import { requestLogger, authLogger } from "./middleware/logger.js"
import healthRoutes from "./routes/health.js"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Middleware de seguridad
app.use(helmet())
app.use(cors())
app.use(express.json())

// Middleware de registro y límite de velocidad
app.use(requestLogger)
app.use(authLogger)
app.use(apiLimiter)

// Middleware de autenticación para todas las rutas de la API
app.use("/api", authMiddleware)

// Rutas
app.use("/api/spaces", spacesRoutes)
app.use("/api/reservations", reservationsRoutes)
app.use("/api/business-rules", businessRulesRoutes)

// Ruta de salud
app.use(healthRoutes)

// Middleware de manejo de errores
app.use(errorHandler)

// Inicializar servidor
const startServer = async () => {
  try {
    // Conectar a la base de datos
    await sequelize.authenticate()
    console.log("✅ Conexión a la base de datos establecida correctamente.")

    // Sincronizar modelos (solo en desarrollo)
    if (process.env.NODE_ENV !== "production") {
      await sequelize.sync({ alter: true })
      console.log("✅ Modelos sincronizados con la base de datos.")
    }

    app.listen(PORT, () => {
      console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`)
      console.log(`📋 Documentación disponible en http://localhost:${PORT}/api/docs`)
    })
  } catch (error) {
    console.error("❌ Error al inicializar el servidor:", error)
    process.exit(1)
  }
}

startServer()

export default app
