-- Script para crear la base de datos y configuración inicial
-- Este script debe ejecutarse como superusuario de PostgreSQL

-- Crear la base de datos si no existe
CREATE DATABASE coworking_reservations;

-- Conectar a la base de datos
\c coworking_reservations;

-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear usuario específico para la aplicación (opcional)
-- CREATE USER coworking_user WITH PASSWORD 'secure_password';
-- GRANT ALL PRIVILEGES ON DATABASE coworking_reservations TO coworking_user;

-- Comentarios sobre el esquema
COMMENT ON DATABASE coworking_reservations IS 'Base de datos para el sistema de gestión de reservas de espacios de coworking';
