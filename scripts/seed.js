import { Space, Reservation } from "../src/models/index.js"
import dotenv from "dotenv"

dotenv.config()

const seedData = async () => {
  try {
    console.log("🌱 Sembrando datos de prueba...")
    const spaces = await Space.bulkCreate([
      {
        nombre: "Sala de Reuniones A",
        ubicacion: "Piso 1",
        capacidad: 8,
        descripcion: "Sala equipada con proyector y pizarra",
      },
      {
        nombre: "Espacio de Coworking Principal",
        ubicacion: "Piso 2",
        capacidad: 20,
        descripcion: "Área abierta con escritorios compartidos",
      },
      {
        nombre: "Sala de Conferencias",
        ubicacion: "Piso 3",
        capacidad: 15,
        descripcion: "Sala grande para presentaciones",
      },
    ])

    console.log(`✅ ${spaces.length} espacios creados`)

    // Crear algunas reservas de ejemplo
    const reservations = await Reservation.bulkCreate([
      {
        espacioId: spaces[0].id,
        emailCliente: "demo@example.com",
        fechaReserva: new Date(Date.now() + 24 * 60 * 60 * 1000), // Mañana
        horaInicio: "09:00",
        horaFin: "11:00",
      },
      {
        espacioId: spaces[1].id,
        emailCliente: "test@example.com",
        fechaReserva: new Date(Date.now() + 48 * 60 * 60 * 1000), // Pasado mañana
        horaInicio: "14:00",
        horaFin: "16:00",
      },
    ])

    console.log(`✅ ${reservations.length} reservas de ejemplo creadas`)
    console.log("🎉 Datos sembrados correctamente")

    process.exit(0)
  } catch (error) {
    console.error("❌ Error sembrando datos:", error)
    process.exit(1)
  }
}

seedData()
