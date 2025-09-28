import fs from "fs"
import path from "path"

// Crear directorio de logs si no existe
const logsDir = path.join(process.cwd(), "logs")
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir)
}

// Logger personalizado para requests
export const requestLogger = (req, res, next) => {
  const start = Date.now()
  const timestamp = new Date().toISOString()
  const { method, url, ip, headers } = req

  // Log de request
  const requestLog = {
    timestamp,
    method,
    url,
    ip,
    userAgent: headers["user-agent"],
    apiKey: headers["x-api-key"] ? "***PROVIDED***" : "MISSING",
  }

  console.log(`📝 ${method} ${url} - ${ip}`)

  // Interceptar la respuesta
  const originalSend = res.send
  res.send = function (data) {
    const duration = Date.now() - start
    const responseLog = {
      ...requestLog,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      responseSize: data ? data.length : 0,
    }

    // Log a archivo en producción
    if (process.env.NODE_ENV === "production") {
      const logFile = path.join(logsDir, `api-${new Date().toISOString().split("T")[0]}.log`)
      fs.appendFileSync(logFile, JSON.stringify(responseLog) + "\n")
    }

    console.log(`✅ ${method} ${url} - ${res.statusCode} - ${duration}ms`)
    originalSend.call(this, data)
  }

  next()
}

// Logger para errores de autenticación
export const authLogger = (req, res, next) => {
  const originalJson = res.json
  res.json = function (data) {
    if (res.statusCode === 401 || res.statusCode === 403) {
      const authLog = {
        timestamp: new Date().toISOString(),
        ip: req.ip,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        error: data.error,
        userAgent: req.headers["user-agent"],
      }

      console.warn(`🚨 Auth Error: ${authLog.error} - ${authLog.ip}`)

      // Log de seguridad en archivo
      if (process.env.NODE_ENV === "production") {
        const securityLogFile = path.join(logsDir, `security-${new Date().toISOString().split("T")[0]}.log`)
        fs.appendFileSync(securityLogFile, JSON.stringify(authLog) + "\n")
      }
    }
    originalJson.call(this, data)
  }
  next()
}
