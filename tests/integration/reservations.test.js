import request from "supertest"
import app from "../../src/server.js"
import { Space, Reservation } from "../../src/models/index.js"
import moment from "moment"

describe("Reservations API Integration Tests", () => {
  const API_KEY = "test-api-key-2024"
  let testSpace, testReservation

  beforeEach(async () => {
    testSpace = await Space.create({
      nombre: "Sala de Prueba",
      ubicacion: "Piso 1",
      capacidad: 10,
      descripcion: "Sala para testing",
      activo: true,
    })

    testReservation = await Reservation.create({
      espacioId: testSpace.id,
      emailCliente: "test@example.com",
      fechaReserva: moment().add(1, "day").format("YYYY-MM-DD"),
      horaInicio: "09:00",
      horaFin: "11:00",
      estado: "activa",
    })
  })

  describe("GET /api/reservations", () => {
    it("should return all reservations with pagination", async () => {
      const response = await request(app).get("/api/reservations").set("x-api-key", API_KEY).expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveLength(1)
      expect(response.body.pagination).toBeDefined()
      expect(response.body.data[0].emailCliente).toBe("test@example.com")
    })

    it("should filter reservations by email", async () => {
      const response = await request(app)
        .get("/api/reservations?emailCliente=test@example.com")
        .set("x-api-key", API_KEY)
        .expect(200)

      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].emailCliente).toBe("test@example.com")
    })
  })

  describe("POST /api/reservations", () => {
    it("should create new reservation", async () => {
      const newReservation = {
        espacioId: testSpace.id,
        emailCliente: "nuevo@example.com",
        fechaReserva: moment().add(2, "days").format("YYYY-MM-DD"),
        horaInicio: "14:00",
        horaFin: "16:00",
      }

      const response = await request(app)
        .post("/api/reservations")
        .set("x-api-key", API_KEY)
        .send(newReservation)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.emailCliente).toBe(newReservation.emailCliente)
      expect(response.body.data.espacio).toBeDefined()
    })

    it("should return 400 for invalid email", async () => {
      const invalidReservation = {
        espacioId: testSpace.id,
        emailCliente: "email-invalido",
        fechaReserva: moment().add(1, "day").format("YYYY-MM-DD"),
        horaInicio: "14:00",
        horaFin: "16:00",
      }

      await request(app).post("/api/reservations").set("x-api-key", API_KEY).send(invalidReservation).expect(400)
    })

    it("should return 409 for time slot conflict", async () => {
      const conflictingReservation = {
        espacioId: testSpace.id,
        emailCliente: "conflicto@example.com",
        fechaReserva: testReservation.fechaReserva,
        horaInicio: "10:00", // Se solapa con la reserva existente
        horaFin: "12:00",
      }

      await request(app).post("/api/reservations").set("x-api-key", API_KEY).send(conflictingReservation).expect(400)
    })

    it("should return 404 for non-existent space", async () => {
      const reservationWithInvalidSpace = {
        espacioId: 99999,
        emailCliente: "test@example.com",
        fechaReserva: moment().add(1, "day").format("YYYY-MM-DD"),
        horaInicio: "14:00",
        horaFin: "16:00",
      }

      await request(app)
        .post("/api/reservations")
        .set("x-api-key", API_KEY)
        .send(reservationWithInvalidSpace)
        .expect(400)
    })
  })

  describe("PATCH /api/reservations/:id/cancel", () => {
    it("should cancel active reservation", async () => {
      const response = await request(app)
        .patch(`/api/reservations/${testReservation.id}/cancel`)
        .set("x-api-key", API_KEY)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.estado).toBe("cancelada")
    })

    it("should return 404 for non-existent reservation", async () => {
      await request(app).patch("/api/reservations/99999/cancel").set("x-api-key", API_KEY).expect(404)
    })
  })

  describe("Weekly reservation limit", () => {
    it("should enforce weekly reservation limit", async () => {
      const email = "limite@example.com"
      const baseDate = moment().add(1, "week").startOf("week")

      // Crear 3 reservas en la misma semana
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post("/api/reservations")
          .set("x-api-key", API_KEY)
          .send({
            espacioId: testSpace.id,
            emailCliente: email,
            fechaReserva: baseDate.clone().add(i, "days").format("YYYY-MM-DD"),
            horaInicio: `${9 + i}:00`,
            horaFin: `${10 + i}:00`,
          })
          .expect(201)
      }

      // Intentar crear una cuarta reserva
      await request(app)
        .post("/api/reservations")
        .set("x-api-key", API_KEY)
        .send({
          espacioId: testSpace.id,
          emailCliente: email,
          fechaReserva: baseDate.clone().add(3, "days").format("YYYY-MM-DD"),
          horaInicio: "12:00",
          horaFin: "13:00",
        })
        .expect(400)
    })
  })
})
