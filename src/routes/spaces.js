import express from "express"
import {
  getAllSpaces,
  getSpaceById,
  createSpace,
  updateSpace,
  deleteSpace,
  checkSpaceAvailability,
} from "../controllers/spacesController.js"
import { validateId, validateSchema, validatePagination } from "../middleware/validation.js"
import { createSpaceSchema, updateSpaceSchema } from "../validators/spaceValidator.js"
import { strictLimiter } from "../middleware/rateLimiter.js"

const router = express.Router()

// GET /api/spaces - Obtener todos los espacios
router.get("/", validatePagination, getAllSpaces)

// GET /api/spaces/:id - Obtener un espacio específico
router.get("/:id", validateId(), getSpaceById)

// GET /api/spaces/:id/availability - Verificar disponibilidad
router.get("/:id/availability", validateId(), checkSpaceAvailability)

// POST /api/spaces - Crear un nuevo espacio
router.post("/", strictLimiter, validateSchema(createSpaceSchema), createSpace)

// PUT /api/spaces/:id - Actualizar un espacio
router.put("/:id", strictLimiter, validateId(), validateSchema(updateSpaceSchema), updateSpace)

// DELETE /api/spaces/:id - Eliminar un espacio
router.delete("/:id", strictLimiter, validateId(), deleteSpace)

export default router
