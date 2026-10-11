# Ventas Garzón - Documentación Técnica

## 📋 Descripción General

Ventas Garzón es una plataforma de comercio electrónico completa para vender productos de aseo y alimentos. Incluye un frontend atractivo, una API REST robusta y un panel de administrador.

## 🛠️ Stack Tecnológico

### Frontend
- **React 18.2** - Librería UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool
- **Tailwind CSS** - Estilos responsivos
- **Framer Motion** - Animaciones
- **Zustand** - Estado global
- **React Router** - Navegación
- **Axios** - Cliente HTTP

### Backend
- **Node.js + Express** - Servidor
- **PostgreSQL** - Base de datos
- **JWT** - Autenticación
- **Bcrypt** - Hash de contraseñas
- **Zod** - Validación de datos
- **TypeScript** - Tipado estático

## 📁 Estructura del Proyecto

```
ventas-garzon/
├── client/
│   ├── src/
│   │   ├── components/       # Componentes (Header, Footer, ProductCard)
│   │   ├── pages/            # Páginas (Landing, Products, Cart, Login)
│   │   ├── services/         # Servicios API
│   │   ├── store/            # Estado global Zustand
│   │   ├── hooks/            # Custom hooks (useAuth, useProducts)
│   │   ├── types/            # Tipos TypeScript
│   │   ├── utils/            # Utilidades y animaciones
│   │   ├── App.tsx           # Componente principal
│   │   ├── main.tsx          # Entrada
│   │   └── index.css          # Estilos globales
│   ├── index.html            # Template HTML
│   ├── vite.config.ts        # Config Vite
│   ├── tailwind.config.js    # Config Tailwind
│   └── tsconfig.json         # Config TypeScript
│
├── server/
│   ├── src/
│   │   ├── controllers/      # Lógica de negocio
│   │   │   ├── auth.ts       # Autenticación
│   │   │   ├── product.ts    # Productos
│   │   │   ├── order.ts      # Órdenes
│   │   │   └── admin.ts      # Admin
│   │   ├── models/           # Modelos de datos
│   │   │   ├── user.ts
│   │   │   ├── product.ts
│   │   │   └── order.ts
│   │   ├── routes/           # Rutas API
│   │   │   ├── auth.ts
│   │   │   ├── products.ts
│   │   │   ├── orders.ts
│   │   │   └── admin.ts
│   │   ├── middleware/       # Middleware
│   │   │   └── auth.ts       # Auth y error handling
│   │   ├── database/         # Conexión BD
│   │   ├── config/           # Configuración
│   │   ├── utils/            # Utilidades
│   │   └── index.ts          # Entrada
│   ├── tsconfig.json         # Config TypeScript
│   └── package.json
│
├── database/
│   ├── schema.sql            # Esquema de BD
│   ├── seeds.sql             # Datos iniciales
│   └── SETUP.md              # Instrucciones setup
│
└── README.md
```

## 🗄️ Modelo de Datos

### Tabla: users
```sql
id (PK), name, email (UNIQUE), password, role, avatar, created_at, updated_at
```

### Tabla: products
```sql
id (PK), name, description, price, image, category, stock, rating, reviews, created_at, updated_at
```

### Tabla: orders
```sql
id (PK), user_id (FK), total, status, shipping_address, created_at, updated_at
```

### Tabla: order_items
```sql
id (PK), order_id (FK), product_id (FK), quantity, price, created_at
```

## 🔐 Autenticación

- **Registro**: POST /api/auth/register
- **Login**: POST /api/auth/login
- **JWT Token**: Bearer token en headers
- **Roles**: customer, admin

## 📱 Componentes Principales

### Frontend
- **Header** - Navegación, carrito, usuario
- **Footer** - Información, links
- **ProductCard** - Tarjeta de producto con animaciones
- **LandingPage** - Página de inicio con hero y offers
- **ProductsPage** - Catálogo con filtros
- **CartPage** - Carrito de compras
- **LoginPage/RegisterPage** - Autenticación

### Backend
- **AuthController** - Registro, login, perfil
- **ProductController** - CRUD productos
- **OrderController** - Crear órdenes, listar
- **AdminController** - Dashboard, analytics

## 🎨 Características de UI

- **Animaciones**: Framer Motion (hover, scroll, entrance)
- **Responsivo**: Mobile-first con Tailwind
- **Colores**: Verde primario (#10b981), naranja secundario (#f59e0b)
- **Transiciones suaves**: CSS y Framer Motion
- **Iconos**: Lucide React
- **Loading States**: Indicadores de carga

## 🔄 Flujo de Datos

1. **Componente** → **Hook/Service** → **API Client** → **Servidor**
2. **Servidor** → **Controller** → **Model** → **Base de Datos**
3. **BD** → **Model** → **Controller** → **Respuesta JSON**
4. **JSON** → **Service** → **Zustand Store** → **Componente actualizado**

## 🚀 Deployment

### Frontend
- Build: `npm run build`
- Deploy a: Vercel, Netlify, GitHub Pages
- Env: VITE_API_URL

### Backend
- Build: `npm run build`
- Deploy a: Heroku, Railway, AWS, DigitalOcean
- Env: DATABASE_URL, JWT_SECRET

## 📊 Análisis de Ventas

- Ventas por categoría
- Ventas diarias (últimos 30 días)
- Productos más vendidos
- Estadísticas generales

## 🔒 Seguridad

- ✅ Contraseñas hasheadas con bcrypt
- ✅ JWT para autenticación
- ✅ CORS configurado
- ✅ Validación Zod
- ✅ Consultas parametrizadas (prevención SQL injection)
- ✅ Roles y middleware de autorización

## 🐛 Error Handling

- Validación en cliente (React)
- Validación en servidor (Zod)
- Custom ApiError class
- Try-catch con error middleware
- Mensajes de error descriptivos

## 📈 Escalabilidad

- Database indexes en FK y búsquedas
- Paginación en listados
- Lazy loading en productos
- Caché en localStorage
- Request deduplication

## 🧪 Testing (Recomendado)

```bash
# Frontend
npm install --save-dev vitest @testing-library/react

# Backend
npm install --save-dev jest @types/jest
```

## 📝 Variables de Entorno

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:5000/api
```

### Backend (.env)
```
PORT=5000
NODE_ENV=development
JWT_SECRET=secret-key
JWT_EXPIRE=7d
DB_USER=user
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ventas_garzon
CORS_ORIGIN=http://localhost:3000
```

## 📚 Recursos Adicionales

- [React Documentation](https://react.dev)
- [Express Documentation](https://expressjs.com)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Framer Motion Documentation](https://www.framer.com/motion)

## 👥 Contribución

Para contribuir:
1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/feature-name`)
3. Commit cambios (`git commit -m 'Add feature'`)
4. Push a la rama (`git push origin feature/feature-name`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo licencia MIT.

## 📞 Soporte

Para soporte técnico, contacta a: support@ventasgarzon.com
