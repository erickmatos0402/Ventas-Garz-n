# Ventas Garzón - E-commerce

Una aplicación de comercio electrónico moderna para vender productos de aseo y alimentos.

## 🚀 Características

- **Landing Page Atractiva** - Diseño moderno con animaciones suaves
- **Catálogo de Productos** - Filtrado por categoría con búsqueda
- **Carrito de Compras** - Gestión completa de compras
- **Autenticación** - Registro e inicio de sesión seguro
- **Panel de Administrador** - Gestión de productos, pedidos y usuarios
- **Análisis de Ventas** - Gráficas y estadísticas
- **Diseño Responsivo** - Optimizado para móvil, tablet y desktop

## 🛠️ Tecnologías

- **Frontend**: React.js, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express.js
- **Base de Datos**: PostgreSQL
- **Autenticación**: JWT
- **Validación**: Zod

## 📋 Requisitos Previos

- Node.js (v16 o superior)
- npm o yarn
- PostgreSQL (v12 o superior)

## 🔧 Instalación y Configuración

### 1. Clonar el Repositorio

```bash
git clone <repositorio>
cd ventas-garzon
```

### 2. Configurar Backend

```bash
cd server
npm install
cp .env.example .env
# Edita .env con tus configuraciones
npm run dev
```

### 3. Configurar Frontend

```bash
cd ../client
npm install
npm start
```

### 4. Configurar Base de Datos

```bash
cd ../database
psql -U postgres -d ventas_garzon -f schema.sql
psql -U postgres -d ventas_garzon -f seeds.sql
```

## 📁 Estructura del Proyecto

```
ventas-garzon/
├── client/                 # Aplicación React
│   ├── src/
│   │   ├── components/    # Componentes reutilizables
│   │   ├── pages/         # Páginas principales
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # Servicios API
│   │   ├── store/         # Estado global (Zustand)
│   │   └── styles/        # Estilos globales
│   └── package.json
├── server/                # API Express
│   ├── src/
│   │   ├── controllers/   # Controladores
│   │   ├── models/        # Modelos de datos
│   │   ├── routes/        # Rutas API
│   │   ├── middleware/    # Middleware personalizado
│   │   └── config/        # Configuración
│   └── package.json
├── database/              # Scripts SQL
│   ├── schema.sql         # Esquema de base de datos
│   └── seeds.sql          # Datos iniciales
└── package.json           # Scripts del proyecto root
```

## 🚀 Comandos Disponibles

```bash
# Desarrollar ambos frontend y backend
npm run dev

# Solo backend
npm run server

# Solo frontend
npm run client

# Build para producción
npm run build
```

## 📚 Documentación de API

La documentación de la API está disponible en `/api/docs` cuando ejecutas el servidor.

### Endpoints Principales

- `GET /api/products` - Obtener todos los productos
- `GET /api/products/:id` - Obtener producto específico
- `POST /api/orders` - Crear orden
- `POST /api/auth/register` - Registrarse
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/admin/dashboard` - Panel de administrador

## 🔒 Seguridad

- Validación de datos en cliente y servidor
- Protección contra inyecciones SQL usando consultas parametrizadas
- JWT para autenticación
- CORS habilitado solo para dominios autorizados
- Variables de entorno para datos sensibles

## 📱 Responsive Design

La aplicación es completamente responsiva:
- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px en adelante

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT.

## 👨‍💼 Contacto

Ventas Garzón - info@ventasgarzon.com
