# Sistema de Gestión de Reservas para Espacios de Trabajo

## Descripción

API REST desarrollada en Node.js para la gestión de reservas en un espacio de coworking. El sistema permite a los clientes reservar salas de reuniones o áreas de trabajo compartido, implementando reglas de negocio robustas y un sistema de autenticación basado en API keys.

## Características Principales

- ✅ **CRUD completo** para Espacios y Reservas
- ✅ **Paginación** en listados de reservas
- ✅ **Reglas de negocio** implementadas:
  - No conflictos de horarios para el mismo espacio
  - Máximo 3 reservas activas por semana por cliente
  - Validación de horarios de operación (8:00 - 22:00)
  - Duración mínima (30 min) y máxima (8 horas) de reservas
- ✅ **Autenticación** mediante API key estática
- ✅ **Base de datos PostgreSQL** con Sequelize ORM
- ✅ **Arquitectura MVC** clara y organizada
- ✅ **Suite completa de pruebas** (unitarias, integración, E2E)
- ✅ **Docker y docker-compose** para despliegue
- ✅ **Rate limiting** y logging de seguridad
- ✅ **Manejo robusto de errores** con códigos HTTP apropiados

## Tecnologías Utilizadas

- **Backend**: Node.js, Express.js
- **Base de datos**: PostgreSQL
- **ORM**: Sequelize
- **Validación**: Joi
- **Testing**: Jest, Supertest
- **Containerización**: Docker, Docker Compose
- **Seguridad**: Helmet, CORS, Rate Limiting

## Instalación y Configuración

### Prerrequisitos

- Node.js 18+
- PostgreSQL 12+
- Docker y Docker Compose (opcional)

### Instalación Local

1. **Clonar el repositorio**
``bash
git clone <repository-url>
cd coworking-reservations-backend
``

3. **Instalar dependencias**
``bash
npm install
``

5. **Configurar variables de entorno**
   
```
cp .env.example .env
# Editar .env con tus configuraciones
```

4. **Configurar base de datos**
```
# Crear base de datos PostgreSQL
createdb coworking_reservations

# Ejecutar scripts de inicialización
psql -d coworking_reservations -f scripts/01_create_database.sql
```

5. **Ejecutar la aplicación**
```
# Desarrollo
npm run dev

# Producción
npm start
```

### Instalación con Docker

1. **Ejecutar con docker-compose**
```
docker-compose up -d
```

Esto iniciará:
- API en puerto 3000
- PostgreSQL en puerto 5432

## Variables de Entorno

```
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=coworking_reservations
DB_USER=postgres
DB_PASSWORD=password

# Servidor
PORT=3000
NODE_ENV=development

# Autenticación
API_KEY=coworking-api-key-2024

# Reglas de negocio
MAX_RESERVATIONS_PER_WEEK=3
```

## Uso de la API

### Autenticación

Todas las rutas de la API requieren el header `x-api-key`:

```
curl -H "x-api-key: coworking-api-key-2024" http://localhost:3000/api/spaces
```

### Endpoints Principales

#### Espacios

- `GET /api/spaces` - Listar espacios (con paginación)
- `GET /api/spaces/:id` - Obtener espacio específico
- `POST /api/spaces` - Crear espacio
- `PUT /api/spaces/:id` - Actualizar espacio
- `DELETE /api/spaces/:id` - Eliminar espacio
- `GET /api/spaces/:id/availability` - Verificar disponibilidad

#### Reservas

- `GET /api/reservations` - Listar reservas (con paginación)
- `GET /api/reservations/:id` - Obtener reserva específica
- `POST /api/reservations` - Crear reserva
- `PUT /api/reservations/:id` - Actualizar reserva
- `DELETE /api/reservations/:id` - Eliminar reserva
- `PATCH /api/reservations/:id/cancel` - Cancelar reserva
- `PATCH /api/reservations/:id/complete` - Completar reserva
- `GET /api/reservations/client/:email` - Reservas por cliente

#### Reglas de Negocio

- `GET /api/business-rules` - Obtener resumen de reglas
- `POST /api/business-rules/validate-reservation` - Validar reserva

### Ejemplos de Uso

#### Crear un Espacio

```
curl -X POST http://localhost:3000/api/spaces \
  -H "Content-Type: application/json" \
  -H "x-api-key: coworking-api-key-2024" \
  -d '{
    "nombre": "Sala de Reuniones A",
    "ubicacion": "Piso 1, Ala Norte",
    "capacidad": 8,
    "descripcion": "Sala equipada con proyector"
  }'
```

#### Crear una Reserva

```
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -H "x-api-key: coworking-api-key-2024" \
  -d '{
    "espacioId": 1,
    "emailCliente": "usuario@example.com",
    "fechaReserva": "2024-12-15",
    "horaInicio": "09:00",
    "horaFin": "11:00"
  }'
```

#### Listar Reservas con Filtros

```
curl "http://localhost:3000/api/reservations?emailCliente=usuario@example.com&page=1&limit=10" \
  -H "x-api-key: coworking-api-key-2024"
```

## Pruebas

### Ejecutar Todas las Pruebas

```
npm test
```

### Tipos de Pruebas

```
# Pruebas unitarias
npm run test:unit

# Pruebas de integración
npm run test:integration

# Pruebas end-to-end
npm run test:e2e

# Pruebas de rendimiento
npm run test:performance

# Cobertura de código
npm run test:coverage
```

### Configuración de Pruebas

Las pruebas utilizan una base de datos separada configurada en `.env.test`:

```
DB_NAME=coworking_reservations_test
NODE_ENV=test
API_KEY=test-api-key-2024
```

## Reglas de Negocio

### Reservas

1. **Conflictos de Horario**: No pueden existir dos reservas activas para el mismo espacio en horarios que se solapen
2. **Límite Semanal**: Máximo 3 reservas activas por semana por cliente
3. **Horario de Operación**: Reservas solo entre 8:00 y 22:00
4. **Duración**: Mínimo 30 minutos, máximo 8 horas
5. **Anticipación**: Máximo 30 días de anticipación
6. **Modificación**: No se puede modificar una reserva que comienza en menos de 2 horas

### Espacios

1. **Estado Activo**: Solo espacios activos pueden ser reservados
2. **Eliminación**: No se pueden eliminar espacios con reservas activas

## Arquitectura

### Patrón MVC

- **Modelos**: Definición de entidades y relaciones (Sequelize)
- **Vistas**: Respuestas JSON estandarizadas
- **Controladores**: Lógica de manejo de requests/responses

### Middleware Stack

1. **Seguridad**: Helmet, CORS
2. **Logging**: Request/response logging
3. **Rate Limiting**: Prevención de abuso
4. **Autenticación**: Validación de API key
5. **Validación**: Esquemas Joi
6. **Error Handling**: Manejo centralizado de errores

### Base de Datos

- **ORM**: Sequelize con PostgreSQL
- **Migraciones**: Sincronización automática en desarrollo
- **Índices**: Optimización de consultas frecuentes
- **Constraints**: Validaciones a nivel de BD

## Seguridad

- **API Key**: Autenticación estática configurable
- **Rate Limiting**: 100 requests/15min general, 20/15min para escritura
- **Input Validation**: Validación exhaustiva con Joi
- **SQL Injection**: Protección via ORM
- **CORS**: Configuración de orígenes permitidos
- **Helmet**: Headers de seguridad HTTP

## Monitoreo y Logging

- **Request Logging**: Todos los requests con tiempo de respuesta
- **Security Logging**: Intentos de acceso no autorizados
- **Error Logging**: Errores detallados para debugging
- **Health Check**: Endpoint `/health` para monitoreo

## Despliegue

### Producción

1. **Variables de entorno**:
```
NODE_ENV=production
DB_HOST=your-db-host
API_KEY=your-secure-api-key
```

2. **Base de datos**:
```
# Ejecutar migraciones en producción
npm run migrate:prod
```

3. **Iniciar aplicación**:
```
npm start
```

### Docker

```
# Construir imagen
docker build -t coworking-api .

# Ejecutar con docker-compose
docker-compose -f docker-compose.prod.yml up -d
```
---

**Desarrollado para**: Darien Technology Hub  

### Este Readme se genero con IA! :)
