import { Sequelize } from "sequelize"
import dotenv from "dotenv"

dotenv.config()

let sequelize

if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false },
    },
  })
} else {
  sequelize = new Sequelize({
    dialect: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || "coworking_reservations",
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "password",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
  })
}

export { sequelize }
