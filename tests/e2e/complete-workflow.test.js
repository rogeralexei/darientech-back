import request from "supertest"
import app from "../../src/server.js"
import moment from "moment"

describe("Complete Workflow E2E Tests", () => {
  const API_KEY = "test-api-key-2024"

  describe("Complete reservation workflow", () => {
    it("should complete full reservation lifecycle", async () => {
      // 1. Crear un espacio
      const spaceResponse = await request(app)
        .post("/api/spaces")
        .set("x-api-key", API_KEY)
        .send({
          nombre: "Sala E2E",
          ubicacion: "Piso Test",
          capacidad: 8,
          descripcion: "Sala para pruebas E2E",
        })
        .expect(201)

      const spaceId = spaceResponse.body.data.id

      // 2. Verificar disponibilidad del espacio
      const availabilityResponse = await request(app)
        .get(`/api/spaces/${spaceId}/availability`)
        .query({
          fecha: moment().add(1, "day").format("YYYY-MM-DD"),
          horaInicio: "09:00",
          horaFin: "11:00",
        })
        .set("x-api-key", API_KEY)
        .expect(200)

      expect(availabilityResponse.body.data.disponible).toBe(true)

      // 3. Crear una reserva
      const reservationResponse = await request(app)
        .post("/api/reservations")
        .set("x-api-key", API_KEY)
        .send({
          espacioId: spaceId,
          emailCliente: "e2e@example.com",
          fechaReserva: moment().add(1, "day").format("YYYY-MM-DD"),
          horaInicio: "09:00",
          horaFin: "11:00",
        })
        .expect(201)

      const reservationId = reservationResponse.body.data.id

      // 4. Verificar que el espacio ya no está disponible en ese horario
      const unavailabilityResponse = await request(app)
        .get(`/api/spaces/${spaceId}/availability`)
        .query({
          fecha: moment().add(1, "day").format("YYYY-MM-DD"),
          horaInicio: "09:00",
          horaFin: "11:00",
        })
        .set("x-api-key", API_KEY)
        .expect(200)

      expect(unavailabilityResponse.body.data.disponible).toBe(false)

      // 5. Obtener reservas del cliente
      const clientReservationsResponse = await request(app)
        .get("/api/reservations/client/e2e@example.com")
        .set("x-api-key", API_KEY)
        .expect(200)

      expect(clientReservationsResponse.body.data).toHaveLength(1)
      expect(clientReservationsResponse.body.data[0].id).toBe(reservationId)

      // 6. Actualizar la reserva
      const updateResponse = await request(app)
        .put(`/api/reservations/${reservationId}`)
        .set("x-api-key", API_KEY)
        .send({
          horaFin: "12:00", // Extender una hora
        })
        .expect(200)

      expect(updateResponse.body.data.horaFin).toBe("12:00")

      // 7. Completar la reserva
      await request(app).patch(`/api/reservations/${reservationId}/complete`).set("x-api-key", API_KEY).expect(200)

      // 8. Verificar que el espacio está disponible nuevamente (reserva completada)
      const finalAvailabilityResponse = await request(app)
        .get(`/api/spaces/${spaceId}/availability`)
        .query({
          fecha: moment().add(1, "day").format("YYYY-MM-DD"),
          horaInicio: "09:00",
          horaFin: "11:00",
        })
        .set("x-api-key", API_KEY)
        .expect(200)

      // La reserva completada no debería bloquear la disponibilidad
      expect(finalAvailabilityResponse.body.data.disponible).toBe(true)
    })

    it("should handle business rules validation", async () => {
      // Crear espacio
      const spaceResponse = await request(app)
        .post("/api/spaces")
        .set("x-api-key", API_KEY)
        .send({
          nombre: "Sala Reglas",
          ubicacion: "Piso Test",
          capacidad: 5,
        })
        .expect(201)

      const spaceId = spaceResponse.body.data.id

      // Intentar crear reserva con fecha pasada
      await request(app)
        .post("/api/reservations")
        .set("x-api-key", API_KEY)
        .send({
          espacioId: spaceId,
          emailCliente: "reglas@example.com",
          fechaReserva: moment().subtract(1, "day").format("YYYY-MM-DD"),
          horaInicio: "09:00",
          horaFin: "11:00",
        })
        .expect(400)

      // Intentar crear reserva fuera del horario de operación
      await request(app)
        .post("/api/reservations")
        .set("x-api-key", API_KEY)
        .send({
          espacioId: spaceId,
          emailCliente: "reglas@example.com",
          fechaReserva: moment().add(1, "day").format("YYYY-MM-DD"),
          horaInicio: "07:00", // Antes de las 8:00
          horaFin: "09:00",
        })
        .expect(400)

      // Intentar crear reserva con duración muy corta
      await request(app)
        .post("/api/reservations")
        .set("x-api-key", API_KEY)
        .send({
          espacioId: spaceId,
          emailCliente: "reglas@example.com",
          fechaReserva: moment().add(1, "day").format("YYYY-MM-DD"),
          horaInicio: "09:00",
          horaFin: "09:15", // Solo 15 minutos
        })
        .expect(400)
    })
  })

  describe("Business rules endpoint", () => {
    it("should return business rules summary", async () => {
      const response = await request(app).get("/api/business-rules").set("x-api-key", API_KEY).expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.reservas).toBeDefined()
      expect(response.body.data.horarios).toBeDefined()
      expect(response.body.data.espacios).toBeDefined()
    })

    it("should validate reservation without creating it", async () => {
      // Crear espacio primero
      const spaceResponse = await request(app)
        .post("/api/spaces")
        .set("x-api-key", API_KEY)
        .send({
          nombre: "Sala Validación",
          ubicacion: "Piso Test",
          capacidad: 6,
        })
        .expect(201)

      const spaceId = spaceResponse.body.data.id

      // Validar reserva válida
      const validResponse = await request(app)
        .post("/api/business-rules/validate-reservation")
        .set("x-api-key", API_KEY)
        .send({
          espacioId: spaceId,
          emailCliente: "validacion@example.com",
          fechaReserva: moment().add(1, "day").format("YYYY-MM-DD"),
          horaInicio: "14:00",
          horaFin: "16:00",
        })
        .expect(200)

      expect(validResponse.body.data.valida).toBe(true)

      // Validar reserva inválida
      const invalidResponse = await request(app)
        .post("/api/business-rules/validate-reservation")
        .set("x-api-key", API_KEY)
        .send({
          espacioId: spaceId,
          emailCliente: "validacion@example.com",
          fechaReserva: moment().subtract(1, "day").format("YYYY-MM-DD"), // Fecha pasada
          horaInicio: "14:00",
          horaFin: "16:00",
        })
        .expect(400)

      expect(invalidResponse.body.details.valida).toBe(false)
    })
  })
})
