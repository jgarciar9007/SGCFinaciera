-- Script para inicializar la base de datos SGCFinaciera
-- Ejecutar con el usuario cndes en PostgreSQL

-- 1. Crear la base de datos (si no existe)
CREATE DATABASE sgcf_db;

-- 2. Conectar a la base de datos
\c sgcf_db

-- La estructura de tablas se creará automáticamente con Prisma
