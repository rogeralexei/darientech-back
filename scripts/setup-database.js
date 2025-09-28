import { sequelize } from "../src/models/index.js"
import dotenv from "dotenv"

dotenv.config()

const setupDatabase = async () => {
  try {
    console.log("🔄 Configurando base de datos...")

    // Verificar conexión
    await sequelize.authenticate()
    console.log("✅ Conexión a base de datos establecida")

    // Sincronizar modelos (crear tablas)
    await sequelize.sync({ force: false, alter: true })
    console.log("✅ Tablas creadas/actualizadas")

    console.log("🎉 Base de datos configurada correctamente")
    process.exit(0)
  } catch (error) {
    console.error("❌ Error configurando base de datos:", error)
    process.exit(1)
  }
}

setupDatabase()
