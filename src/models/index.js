import { Space } from "./Space.js"
import { Reservation } from "./Reservation.js"
import { sequelize } from "../config/database.js"

// Exportar todos los modelos
export { Space, Reservation }

export { sequelize }

// Función para sincronizar todos los modelos
export const syncModels = async () => {
  try {
    await Space.sync()
    await Reservation.sync()
    console.log("✅ Todos los modelos han sido sincronizados correctamente.")
  } catch (error) {
    console.error("❌ Error al sincronizar modelos:", error)
    throw error
  }
}
