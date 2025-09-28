import { Space, Reservation } from "../models/index.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Op } from "sequelize"

// GET /api/spaces - Obtener todos los espacios con paginación
export const getAllSpaces = asyncHandler(async (req, res) => {
  const { page, limit, offset } = req.pagination
  const { search, capacidad_min, capacidad_max, activo } = req.query

  // Construir filtros dinámicos
  const whereClause = {}

  if (search) {
    whereClause[Op.or] = [
      { nombre: { [Op.iLike]: `%${search}%` } },
      { ubicacion: { [Op.iLike]: `%${search}%` } },
      { descripcion: { [Op.iLike]: `%${search}%` } },
    ]
  }

  if (capacidad_min) {
    whereClause.capacidad = { ...whereClause.capacidad, [Op.gte]: Number.parseInt(capacidad_min) }
  }

  if (capacidad_max) {
    whereClause.capacidad = { ...whereClause.capacidad, [Op.lte]: Number.parseInt(capacidad_max) }
  }

  if (activo !== undefined) {
    whereClause.activo = activo === "true"
  }

  const { count, rows } = await Space.findAndCountAll({
    where: whereClause,
    limit,
    offset,
    order: [["nombre", "ASC"]],
    include: [
      {
        model: Reservation,
        as: "reservas",
        attributes: ["id", "fechaReserva", "horaInicio", "horaFin", "estado"],
        where: { estado: "activa" },
        required: false,
      },
    ],
  })

  res.json(ApiResponse.paginated(rows, { page, limit, total: count }, `Se encontraron ${count} espacios`))
})

// GET /api/spaces/:id - Obtener un espacio específico
export const getSpaceById = asyncHandler(async (req, res) => {
  const { id } = req.params

  const space = await Space.findByPk(id, {
    include: [
      {
        model: Reservation,
        as: "reservas",
        attributes: ["id", "emailCliente", "fechaReserva", "horaInicio", "horaFin", "estado"],
        order: [
          ["fechaReserva", "ASC"],
          ["horaInicio", "ASC"],
        ],
      },
    ],
  })

  if (!space) {
    return res.status(404).json(ApiResponse.error("Espacio no encontrado", 404))
  }

  res.json(ApiResponse.success(space, "Espacio obtenido exitosamente"))
})

// POST /api/spaces - Crear un nuevo espacio
export const createSpace = asyncHandler(async (req, res) => {
  const spaceData = req.body

  // Verificar si ya existe un espacio con el mismo nombre
  const existingSpace = await Space.findOne({
    where: { nombre: spaceData.nombre },
  })

  if (existingSpace) {
    return res.status(409).json(ApiResponse.error("Ya existe un espacio con ese nombre", 409))
  }

  const newSpace = await Space.create(spaceData)

  res.status(201).json(ApiResponse.success(newSpace, "Espacio creado exitosamente", 201))
})

// PUT /api/spaces/:id - Actualizar un espacio
export const updateSpace = asyncHandler(async (req, res) => {
  const { id } = req.params
  const updateData = req.body

  const space = await Space.findByPk(id)

  if (!space) {
    return res.status(404).json(ApiResponse.error("Espacio no encontrado", 404))
  }

  // Si se está actualizando el nombre, verificar que no exista otro con el mismo nombre
  if (updateData.nombre && updateData.nombre !== space.nombre) {
    const existingSpace = await Space.findOne({
      where: {
        nombre: updateData.nombre,
        id: { [Op.ne]: id },
      },
    })

    if (existingSpace) {
      return res.status(409).json(ApiResponse.error("Ya existe otro espacio con ese nombre", 409))
    }
  }

  await space.update(updateData)

  res.json(ApiResponse.success(space, "Espacio actualizado exitosamente"))
})

// DELETE /api/spaces/:id - Eliminar un espacio
export const deleteSpace = asyncHandler(async (req, res) => {
  const { id } = req.params

  const space = await Space.findByPk(id, {
    include: [
      {
        model: Reservation,
        as: "reservas",
        where: { estado: "activa" },
        required: false,
      },
    ],
  })

  if (!space) {
    return res.status(404).json(ApiResponse.error("Espacio no encontrado", 404))
  }

  // Verificar si tiene reservas activas
  if (space.reservas && space.reservas.length > 0) {
    return res.status(409).json(
      ApiResponse.error("No se puede eliminar el espacio porque tiene reservas activas", 409, {
        reservasActivas: space.reservas.length,
        mensaje: "Cancele o complete las reservas activas antes de eliminar el espacio",
      }),
    )
  }

  await space.destroy()

  res.json(ApiResponse.success(null, "Espacio eliminado exitosamente"))
})

// GET /api/spaces/:id/availability - Verificar disponibilidad de un espacio
export const checkSpaceAvailability = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { fecha, horaInicio, horaFin } = req.query

  if (!fecha || !horaInicio || !horaFin) {
    return res.status(400).json(ApiResponse.error("Parámetros requeridos: fecha, horaInicio, horaFin", 400))
  }

  const space = await Space.findByPk(id)

  if (!space) {
    return res.status(404).json(ApiResponse.error("Espacio no encontrado", 404))
  }

  if (!space.activo) {
    return res.json(
      ApiResponse.success({ disponible: false, razon: "El espacio no está activo" }, "Espacio no disponible"),
    )
  }

  // Buscar conflictos de horario
  const conflictingReservations = await Reservation.findAll({
    where: {
      espacioId: id,
      fechaReserva: fecha,
      estado: "activa",
      [Op.or]: [
        {
          horaInicio: { [Op.lt]: horaFin },
          horaFin: { [Op.gt]: horaInicio },
        },
      ],
    },
  })

  const disponible = conflictingReservations.length === 0

  res.json(
    ApiResponse.success(
      {
        disponible,
        espacio: {
          id: space.id,
          nombre: space.nombre,
          capacidad: space.capacidad,
        },
        fecha,
        horaInicio,
        horaFin,
        conflictos: disponible
          ? []
          : conflictingReservations.map((r) => ({
              id: r.id,
              horaInicio: r.horaInicio,
              horaFin: r.horaFin,
            })),
      },
      disponible ? "Espacio disponible" : "Espacio no disponible",
    ),
  )
})
