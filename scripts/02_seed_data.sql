-- Script para insertar datos de prueba
-- Ejecutar después de que los modelos hayan sido sincronizados

-- Insertar espacios de ejemplo
INSERT INTO spaces (nombre, ubicacion, capacidad, descripcion, "createdAt", "updatedAt") VALUES
('Sala de Reuniones A', 'Piso 1, Ala Norte', 8, 'Sala equipada con proyector y pizarra digital', NOW(), NOW()),
('Sala de Reuniones B', 'Piso 1, Ala Sur', 12, 'Sala grande con mesa de conferencias y sistema de videoconferencia', NOW(), NOW()),
('Espacio de Trabajo Compartido 1', 'Piso 2, Área Central', 20, 'Área abierta con escritorios compartidos y conexión WiFi', NOW(), NOW()),
('Sala Privada Premium', 'Piso 3, Esquina Este', 4, 'Oficina privada con vista panorámica y mobiliario ejecutivo', NOW(), NOW()),
('Sala de Creatividad', 'Piso 2, Ala Oeste', 6, 'Espacio diseñado para brainstorming con pizarras y material creativo', NOW(), NOW());

-- Insertar algunas reservas de ejemplo
INSERT INTO reservations ("espacioId", "emailCliente", "fechaReserva", "horaInicio", "horaFin", estado, "createdAt", "updatedAt") VALUES
(1, 'juan.perez@email.com', '2024-12-01', '09:00', '11:00', 'activa', NOW(), NOW()),
(2, 'maria.garcia@email.com', '2024-12-01', '14:00', '16:00', 'activa', NOW(), NOW()),
(3, 'carlos.rodriguez@email.com', '2024-12-02', '10:00', '12:00', 'activa', NOW(), NOW()),
(1, 'ana.martinez@email.com', '2024-12-02', '15:00', '17:00', 'activa', NOW(), NOW()),
(4, 'luis.gonzalez@email.com', '2024-12-03', '09:00', '18:00', 'activa', NOW(), NOW());
