// Utilidades para respuestas consistentes de la API
export class ApiResponse {
  static success(data, message = "Operación exitosa", statusCode = 200) {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    }
  }

  static error(message, statusCode = 500, details = null) {
    return {
      success: false,
      error: message,
      details,
      timestamp: new Date().toISOString(),
    }
  }

  static paginated(data, pagination, message = "Datos obtenidos exitosamente") {
    return {
      success: true,
      message,
      data,
      pagination: {
        currentPage: pagination.page,
        itemsPerPage: pagination.limit,
        totalItems: pagination.total,
        totalPages: Math.ceil(pagination.total / pagination.limit),
        hasNextPage: pagination.page < Math.ceil(pagination.total / pagination.limit),
        hasPrevPage: pagination.page > 1,
      },
      timestamp: new Date().toISOString(),
    }
  }
}
