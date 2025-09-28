import request from "supertest"
import app from "../../src/server.js"
import { Space } from "../../src/models/index.js"

describe("Spaces API Integration Tests", () => {
  const API_KEY = "test-api-key-2024"
  let testSpace

  beforeEach(async () => {
    testSpace = await Space.create({
      nombre: "Sala de Prueba",
      ubicacion: "Piso 1",
      capacidad: 10,
      descripcion: "Sala para testing",
    })
  })

  describe("GET /api/spaces", () => {
    it("should return all spaces with pagination", async () => {
      const response = await request(app).get("/api/spaces").set("x-api-key", API_KEY).expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveLength(1)
      expect(response.body.pagination).toBeDefined()
      expect(response.body.data[0].nombre).toBe("Sala de Prueba")
    })

    it("should return 401 without API key", async () => {
      await request(app).get("/api/spaces").expect(401)
    })

    it("should return 403 with invalid API key", async () => {
      await request(app).get("/api/spaces").set("x-api-key", "invalid-key").expect(403)
    })
  })

  describe("GET /api/spaces/:id", () => {
    it("should return specific space", async () => {
      const response = await request(app).get(`/api/spaces/${testSpace.id}`).set("x-api-key", API_KEY).expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.id).toBe(testSpace.id)
      expect(response.body.data.nombre).toBe("Sala de Prueba")
    })

    it("should return 404 for non-existent space", async () => {
      await request(app).get("/api/spaces/99999").set("x-api-key", API_KEY).expect(404)
    })
  })

  describe("POST /api/spaces", () => {
    it("should create new space", async () => {
      const newSpace = {
        nombre: "Nueva Sala",
        ubicacion: "Piso 2",
        capacidad: 15,
        descripcion: "Sala nueva para testing",
      }

      const response = await request(app).post("/api/spaces").set("x-api-key", API_KEY).send(newSpace).expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.nombre).toBe(newSpace.nombre)
      expect(response.body.data.capacidad).toBe(newSpace.capacidad)
    })

    it("should return 400 for invalid data", async () => {
      const invalidSpace = {
        nombre: "", // Nombre vacío
        ubicacion: "Piso 2",
        capacidad: -5, // Capacidad negativa
      }

      await request(app).post("/api/spaces").set("x-api-key", API_KEY).send(invalidSpace).expect(400)
    })

    it("should return 409 for duplicate name", async () => {
      const duplicateSpace = {
        nombre: "Sala de Prueba", // Mismo nombre que testSpace
        ubicacion: "Piso 2",
        capacidad: 15,
      }

      await request(app).post("/api/spaces").set("x-api-key", API_KEY).send(duplicateSpace).expect(409)
    })
  })

  describe("PUT /api/spaces/:id", () => {
    it("should update existing space", async () => {
      const updateData = {
        nombre: "Sala Actualizada",
        capacidad: 20,
      }

      const response = await request(app)
        .put(`/api/spaces/${testSpace.id}`)
        .set("x-api-key", API_KEY)
        .send(updateData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.nombre).toBe(updateData.nombre)
      expect(response.body.data.capacidad).toBe(updateData.capacidad)
    })

    it("should return 404 for non-existent space", async () => {
      await request(app).put("/api/spaces/99999").set("x-api-key", API_KEY).send({ nombre: "Test" }).expect(404)
    })
  })

  describe("DELETE /api/spaces/:id", () => {
    it("should delete space without active reservations", async () => {
      await request(app).delete(`/api/spaces/${testSpace.id}`).set("x-api-key", API_KEY).expect(200)

      // Verificar que el espacio fue eliminado
      const deletedSpace = await Space.findByPk(testSpace.id)
      expect(deletedSpace).toBeNull()
    })

    it("should return 404 for non-existent space", async () => {
      await request(app).delete("/api/spaces/99999").set("x-api-key", API_KEY).expect(404)
    })
  })
})
