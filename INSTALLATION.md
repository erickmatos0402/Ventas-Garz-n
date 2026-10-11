# Guía de Instalación y Configuración

## Requisitos Previos

- Node.js v16+ (descargar de https://nodejs.org/)
- PostgreSQL v12+ (descargar de https://www.postgresql.org/)
- Git (opcional, para control de versiones)

## 1. Configurar Base de Datos PostgreSQL

### Windows/macOS/Linux:

```bash
# 1. Abrir PostgreSQL (psql)
psql -U postgres

# 2. Crear usuario y base de datos
CREATE USER ventas_garzon WITH PASSWORD 'password123';
CREATE DATABASE ventas_garzon OWNER ventas_garzon;
GRANT ALL PRIVILEGES ON DATABASE ventas_garzon TO ventas_garzon;

# 3. Salir de psql
\q

# 4. Ejecutar schema
psql -U ventas_garzon -d ventas_garzon -f database/schema.sql
```

## 2. Configurar Backend

```bash
# Navegar a carpeta server
cd server

# Crear archivo .env
cp .env.example .env

# Editar .env con tus credenciales de PostgreSQL
# DB_USER=ventas_garzon
# DB_PASSWORD=password123
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=ventas_garzon

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev
```

El servidor estará disponible en: **http://localhost:5000**

## 3. Configurar Frontend

```bash
# Navegar a carpeta client
cd client

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev
```

La aplicación estará disponible en: **http://localhost:3000**

## 4. Ejecutar Ambos (opcional)

Desde la carpeta raíz:

```bash
npm install
npm run dev
```

## Credenciales de Prueba

**Usuario Admin:**
- Email: admin@ventasgarzon.com
- Contraseña: password (cambiar en producción)

**Usuario Cliente:**
- Email: juan@example.com
- Contraseña: password

## Estructura de Carpetas

```
ventas-garzon/
├── client/              # Frontend React
│   ├── src/
│   │   ├── components/  # Componentes reutilizables
│   │   ├── pages/       # Páginas principales
│   │   ├── services/    # Servicios API
│   │   └── store/       # Estado global
│   └── package.json
├── server/              # Backend Express
│   ├── src/
│   │   ├── controllers/ # Controladores
│   │   ├── models/      # Modelos
│   │   ├── routes/      # Rutas
│   │   └── middleware/  # Middleware
│   └── package.json
├── database/            # Scripts SQL
│   ├── schema.sql       # Esquema
│   └── seeds.sql        # Datos iniciales
└── README.md
```

## Endpoints Principales

### Autenticación
- `POST /api/auth/register` - Registrarse
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Usuario actual

### Productos
- `GET /api/products` - Listar productos
- `GET /api/products/:id` - Obtener producto
- `GET /api/products/search?q=...` - Buscar

### Órdenes
- `POST /api/orders` - Crear orden
- `GET /api/orders` - Mis órdenes
- `GET /api/orders/:id` - Detalle orden

### Admin
- `GET /api/admin/dashboard` - Dashboard
- `GET /api/admin/orders` - Todas las órdenes
- `GET /api/admin/users` - Usuarios
- `GET /api/admin/analytics/sales` - Análisis

## Solución de Problemas

**Error: "Connection refused" en PostgreSQL**
- Asegurate que PostgreSQL está ejecutándose
- Verifica las credenciales en .env

**Puerto 3000/5000 en uso**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3000
kill -9 <PID>
```

**Dependencias no instalan**
```bash
# Limpiar caché
npm cache clean --force

# Reinstalar
rm -rf node_modules package-lock.json
npm install
```

## Contacto y Soporte

Para preguntas o problemas, contacta a: info@ventasgarzon.com
