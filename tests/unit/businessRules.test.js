import { BusinessRules } from "../../src/services/businessRules.js"
import { Space, Reservation } from "../../src/models/index.js"
import moment from "moment"

describe("BusinessRules", () => {
  let testSpace

  beforeEach(async () => {
    // Crear un espacio de prueba
    testSpace = await Space.create({
      nombre: "Sala de Prueba",
      ubicacion: "Piso 1",
      capacidad: 10,
      descripcion: "Sala para testing",
      activo: true,
    })
  })

  describe("validateTimeSlotConflict", () => {
    it("should pass when no conflicts exist", async () => {
      const result = await BusinessRules.validateTimeSlotConflict(testSpace.id, "2024-12-15", "09:00", "11:00")
      expect(result).toBe(true)
    })

    it("should throw error when time slot conflicts", async () => {
      // Crear una reserva existente
      await Reservation.create({
        espacioId: testSpace.id,
        emailCliente: "test@example.com",
        fechaReserva: "2024-12-15",
        horaInicio: "10:00",
        horaFin: "12:00",
        estado: "activa",
      })

      // Intentar crear otra reserva que se solape
      await expect(
        BusinessRules.validateTimeSlotConflict(testSpace.id, "2024-12-15", "09:00", "11:00"),
      ).rejects.toThrow("Conflicto de horario detectado")
    })
  })

  describe("validateWeeklyReservationLimit", () => {
    it("should pass when under weekly limit", async () => {
      const result = await BusinessRules.validateWeeklyReservationLimit("test@example.com", "2024-12-15")
      expect(result).toBe(true)
    })

    it("should throw error when weekly limit exceeded", async () => {
      const email = "test@example.com"
      const fecha = "2024-12-15"

      // Crear 3 reservas activas en la misma semana
      for (let i = 0; i < 3; i++) {
        await Reservation.create({
          espacioId: testSpace.id,
          emailCliente: email,
          fechaReserva: moment(fecha).add(i, "days").format("YYYY-MM-DD"),
          horaInicio: "09:00",
          horaFin: "10:00",
          estado: "activa",
        })
      }

      // Intentar crear una cuarta reserva
      await expect(BusinessRules.validateWeeklyReservationLimit(email, fecha)).rejects.toThrow(
        "ha alcanzado el límite de 3 reservas activas por semana",
      )
    })
  })

  describe("validateSpaceAvailability", () => {
    it("should return space when active", async () => {
      const result = await BusinessRules.validateSpaceAvailability(testSpace.id)
      expect(result.id).toBe(testSpace.id)
      expect(result.activo).toBe(true)
    })

    it("should throw error when space is inactive", async () => {
      await testSpace.update({ activo: false })

      await expect(BusinessRules.validateSpaceAvailability(testSpace.id)).rejects.toThrow(
        "no está disponible para reservas",
      )
    })

    it("should throw error when space does not exist", async () => {
      await expect(BusinessRules.validateSpaceAvailability(99999)).rejects.toThrow("no existe")
    })
  })

  describe("validateFutureDate", () => {
    it("should pass for future dates", () => {
      const futureDate = moment().add(1, "day").format("YYYY-MM-DD")
      const result = BusinessRules.validateFutureDate(futureDate)
      expect(result).toBe(true)
    })

    it("should throw error for past dates", () => {
      const pastDate = moment().subtract(1, "day").format("YYYY-MM-DD")
      expect(() => BusinessRules.validateFutureDate(pastDate)).toThrow("debe ser futura")
    })
  })

  describe("validateTimeRange", () => {
    it("should pass when end time is after start time", () => {
      const result = BusinessRules.validateTimeRange("09:00", "11:00")
      expect(result).toBe(true)
    })

    it("should throw error when end time is before start time", () => {
      expect(() => BusinessRules.validateTimeRange("11:00", "09:00")).toThrow("debe ser posterior a la hora de inicio")
    })

    it("should throw error when times are equal", () => {
      expect(() => BusinessRules.validateTimeRange("09:00", "09:00")).toThrow("debe ser posterior a la hora de inicio")
    })
  })

  describe("validateOperatingHours", () => {
    it("should pass for valid operating hours", () => {
      const result = BusinessRules.validateOperatingHours("09:00", "18:00")
      expect(result).toBe(true)
    })

    it("should throw error for hours outside operating range", () => {
      expect(() => BusinessRules.validateOperatingHours("07:00", "09:00")).toThrow("horario de operación")
      expect(() => BusinessRules.validateOperatingHours("20:00", "23:00")).toThrow("horario de operación")
    })
  })

  describe("validateReservationDuration", () => {
    it("should pass for valid duration", () => {
      const result = BusinessRules.validateReservationDuration("09:00", "11:00")
      expect(result).toBe(true)
    })

    it("should throw error for too short duration", () => {
      expect(() => BusinessRules.validateReservationDuration("09:00", "09:15")).toThrow("duración mínima")
    })

    it("should throw error for too long duration", () => {
      expect(() => BusinessRules.validateReservationDuration("09:00", "18:00")).toThrow("duración máxima")
    })
  })
})
