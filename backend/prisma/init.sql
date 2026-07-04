-- DCBrain Database Initialization Script
-- This runs on first container startup

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Prisma migrations own the application schema (enums, tables, indexes).
-- This script only ensures PostgreSQL extensions are available.
