import { DataTypes } from "sequelize"
import { sequelize } from "../config/database.js"
import { Space } from "./Space.js"

export const Reservation = sequelize.define(
  "Reservation",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    espacioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Space,
        key: "id",
      },
    },
    emailCliente: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: {
          msg: "Debe proporcionar un email válido",
        },
        notEmpty: {
          msg: "El email del cliente es requerido",
        },
      },
    },
    fechaReserva: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: {
          msg: "Debe proporcionar una fecha válida",
        },
        isAfter: {
          args: new Date().toISOString().split("T")[0],
          msg: "La fecha de reserva debe ser futura",
        },
      },
    },
    horaInicio: {
      type: DataTypes.TIME,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "La hora de inicio es requerida",
        },
        is: {
          args: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
          msg: "La hora de inicio debe tener formato HH:mm",
        },
      },
    },
    horaFin: {
      type: DataTypes.TIME,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "La hora de fin es requerida",
        },
        is: {
          args: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
          msg: "La hora de fin debe tener formato HH:mm",
        },
      },
    },
    estado: {
      type: DataTypes.ENUM("activa", "cancelada", "completada"),
      defaultValue: "activa",
    },
  },
  {
    tableName: "reservations",
    timestamps: true,
    validate: {
      horaFinMayorQueInicio() {
        if (this.horaInicio >= this.horaFin) {
          throw new Error("La hora de fin debe ser posterior a la hora de inicio")
        }
      },
    },
    indexes: [
      {
        fields: ["emailCliente"],
      },
      {
        fields: ["fechaReserva"],
      },
      {
        fields: ["espacioId", "fechaReserva"],
      },
      {
        unique: true,
        fields: ["espacioId", "fechaReserva", "horaInicio", "horaFin"],
        name: "unique_space_time_slot",
      },
    ],
  },
)

// Definir relaciones
Space.hasMany(Reservation, {
  foreignKey: "espacioId",
  as: "reservas",
  onDelete: "CASCADE",
})

Reservation.belongsTo(Space, {
  foreignKey: "espacioId",
  as: "espacio",
})
