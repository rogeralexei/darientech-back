import request from "supertest"
import app from "../../src/server.js"
import { Space } from "../../src/models/index.js"

describe("Performance Tests", () => {
  const API_KEY = "test-api-key-2024"
  let testSpaces = []

  beforeAll(async () => {
    // Crear múltiples espacios para pruebas de carga
    const spacePromises = []
    for (let i = 1; i <= 50; i++) {
      spacePromises.push(
        Space.create({
          nombre: `Sala ${i}`,
          ubicacion: `Piso ${Math.ceil(i / 10)}`,
          capacidad: 5 + (i % 15),
          descripcion: `Sala de prueba número ${i}`,
          activo: true,
        }),
      )
    }
    testSpaces = await Promise.all(spacePromises)
  })

  describe("API Response Times", () => {
    it("should handle multiple concurrent requests", async () => {
      const startTime = Date.now()
      const requests = []

      // Crear 20 requests concurrentes
      for (let i = 0; i < 20; i++) {
        requests.push(request(app).get("/api/spaces").set("x-api-key", API_KEY).expect(200))
      }

      const responses = await Promise.all(requests)
      const endTime = Date.now()
      const totalTime = endTime - startTime

      // Verificar que todas las respuestas son exitosas
      responses.forEach((response) => {
        expect(response.body.success).toBe(true)
        expect(response.body.data.length).toBeGreaterThan(0)
      })

      // Verificar tiempo de respuesta razonable (menos de 5 segundos para 20 requests)
      expect(totalTime).toBeLessThan(5000)
      console.log(`20 concurrent requests completed in ${totalTime}ms`)
    })

    it("should handle pagination efficiently", async () => {
      const startTime = Date.now()

      // Probar diferentes páginas
      const pageRequests = []
      for (let page = 1; page <= 5; page++) {
        pageRequests.push(request(app).get(`/api/spaces?page=${page}&limit=10`).set("x-api-key", API_KEY).expect(200))
      }

      const responses = await Promise.all(pageRequests)
      const endTime = Date.now()
      const totalTime = endTime - startTime

      // Verificar respuestas
      responses.forEach((response, index) => {
        expect(response.body.success).toBe(true)
        expect(response.body.pagination.currentPage).toBe(index + 1)
      })

      expect(totalTime).toBeLessThan(2000)
      console.log(`Pagination requests completed in ${totalTime}ms`)
    })
  })

  describe("Database Performance", () => {
    it("should handle complex queries efficiently", async () => {
      const startTime = Date.now()

      // Query compleja con filtros y joins
      const response = await request(app)
        .get("/api/spaces?search=Sala&capacidad_min=5&capacidad_max=20")
        .set("x-api-key", API_KEY)
        .expect(200)

      const endTime = Date.now()
      const queryTime = endTime - startTime

      expect(response.body.success).toBe(true)
      expect(queryTime).toBeLessThan(1000) // Menos de 1 segundo
      console.log(`Complex query completed in ${queryTime}ms`)
    })
  })
})
