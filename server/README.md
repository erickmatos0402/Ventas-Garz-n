# Ventas Garzón - Backend API

API REST con Express.js y PostgreSQL.

## Instalación

```bash
npm install
```

## Configuración

Crear archivo `.env`:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=tu-secreto-aqui
JWT_EXPIRE=7d

# Database
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ventas_garzon

# CORS
CORS_ORIGIN=http://localhost:3000
```

## Setup Base de Datos

```bash
npm run db:setup
```

## Desarrollo

```bash
npm run dev
```

## Build

```bash
npm run build
npm start
```

## Endpoints

### Autenticación
- `POST /api/auth/register` - Registrarse
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Usuario actual
- `PUT /api/auth/profile` - Actualizar perfil

### Productos
- `GET /api/products` - Listar productos
- `GET /api/products/:id` - Obtener producto
- `GET /api/products/search` - Buscar productos
- `POST /api/products` - Crear producto (admin)
- `PUT /api/products/:id` - Actualizar producto (admin)
- `DELETE /api/products/:id` - Eliminar producto (admin)

### Órdenes
- `POST /api/orders` - Crear orden
- `GET /api/orders` - Mis órdenes
- `GET /api/orders/:id` - Detalle de orden
- `PATCH /api/orders/:id/status` - Actualizar estado

### Administrador
- `GET /api/admin/dashboard` - Dashboard
- `GET /api/admin/products` - Todos los productos
- `GET /api/admin/orders` - Todos los órdenes
- `GET /api/admin/users` - Usuarios
- `GET /api/admin/analytics/sales` - Análisis de ventas
