-- Instrucciones para setup de PostgreSQL

/*

1. INSTALAR POSTGRESQL
   - Windows: https://www.postgresql.org/download/windows/
   - macOS: brew install postgresql
   - Linux: sudo apt-get install postgresql

2. INICIAR POSTGRESQL
   - Windows: PostgreSQL should start automatically
   - macOS: brew services start postgresql
   - Linux: sudo systemctl start postgresql

3. CREAR BASE DE DATOS Y USUARIO

   # Conectar a PostgreSQL
   psql -U postgres

   # En la consola de PostgreSQL:
   CREATE USER ventas_garzon WITH PASSWORD 'password123';
   CREATE DATABASE ventas_garzon OWNER ventas_garzon;
   GRANT ALL PRIVILEGES ON DATABASE ventas_garzon TO ventas_garzon;

4. EJECUTAR SCHEMA

   psql -U ventas_garzon -d ventas_garzon -f schema.sql

5. VERIFICAR

   psql -U ventas_garzon -d ventas_garzon
   \dt  -- Listar tablas
   \q   -- Salir

6. CONFIGURAR .env EN SERVER

   DB_USER=ventas_garzon
   DB_PASSWORD=password123
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=ventas_garzon

*/
