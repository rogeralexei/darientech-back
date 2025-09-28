import { sequelize } from "../src/config/database.js"
import dotenv from "dotenv"
import { beforeAll, afterAll, beforeEach } from "@jest/globals"

// Cargar variables de entorno para testing
dotenv.config({ path: ".env.test" })

// Configuración global para tests
beforeAll(async () => {
  // Conectar a la base de datos de pruebas
  await sequelize.authenticate()

  // Sincronizar modelos (recrear tablas)
  await sequelize.sync({ force: true })
})

afterAll(async () => {
  // Cerrar conexión después de todos los tests
  await sequelize.close()
})

// Limpiar base de datos antes de cada test
beforeEach(async () => {
  // Limpiar todas las tablas
  await sequelize.truncate({ cascade: true, restartIdentity: true })
})
