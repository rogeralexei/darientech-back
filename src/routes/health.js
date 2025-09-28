import express from "express"
import { sequelize } from "../models/index.js"

const router = express.Router()

router.get("/health", async (req, res) => {
  try {
    // Check database connection
    await sequelize.authenticate()

    res.status(200).json({
      status: "OK",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: "Connected",
      environment: process.env.NODE_ENV || "development",
    })
  } catch (error) {
    res.status(503).json({
      status: "ERROR",
      timestamp: new Date().toISOString(),
      database: "Disconnected",
      error: error.message,
    })
  }
})

export default router
