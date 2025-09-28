import { DataTypes } from "sequelize"
import { sequelize } from "../config/database.js"

export const Space = sequelize.define(
  "Space",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "El nombre del espacio es requerido",
        },
        len: {
          args: [2, 100],
          msg: "El nombre debe tener entre 2 y 100 caracteres",
        },
      },
    },
    ubicacion: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "La ubicación es requerida",
        },
        len: {
          args: [2, 200],
          msg: "La ubicación debe tener entre 2 y 200 caracteres",
        },
      },
    },
    capacidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: {
          args: [1],
          msg: "La capacidad debe ser al menos 1 persona",
        },
        max: {
          args: [100],
          msg: "La capacidad no puede exceder 100 personas",
        },
      },
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 500],
          msg: "La descripción no puede exceder 500 caracteres",
        },
      },
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "spaces",
    timestamps: true,
    indexes: [
      {
        fields: ["nombre"],
      },
      {
        fields: ["ubicacion"],
      },
    ],
  },
)
