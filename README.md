# Ventas Garzón - E-commerce

Aplicación de comercio electrónico para vender productos de aseo y alimentos
(Mercado) y prendas de segunda mano (Boutique).

## 🚀 Características

- **Landing Page Atractiva** - Diseño con animaciones suaves
- **Catálogo de Productos** - Filtrado por categoría y búsqueda
- **Carrito de Compras** - Gestión completa, persistido en el navegador
- **Autenticación** - Registro e inicio de sesión con Supabase Auth
- **Pedidos reales** - Se guardan en Supabase y descuentan stock
- **Panel de Administrador** - Alta, edición y borrado de productos
- **Diseño Responsivo** - Optimizado para móvil, tablet y desktop

## 🛠️ Tecnologías

- **Frontend**: React, TypeScript, Tailwind CSS, Framer Motion, Zustand
- **Backend as a Service**: Supabase (PostgreSQL, Auth, Row Level Security)
- **Build**: Vite

## 📋 Requisitos Previos

- Node.js 18 o superior
- npm
- Un proyecto de Supabase (gratuito)

## 🔧 Instalación y Configuración

### 1. Instalar dependencias

```bash
npm install
npm --prefix client install
```

### 2. Configurar Supabase

Sigue [`database/supabase/SETUP.md`](database/supabase/SETUP.md):

1. Ejecuta `database/supabase/schema.sql` en el **SQL Editor**.
2. Ejecuta `database/supabase/seed.sql` para cargar el catálogo.
3. Crea `client/.env.local` a partir de `client/.env.example`.
4. Regístrate en la app y asígnate el rol `admin` con el SQL indicado.

### 3. Arrancar en desarrollo

```bash
npm run dev
```

Abre http://localhost:3000

## 📁 Estructura del Proyecto

```
ventas-garzon/
├── client/                     # Aplicación React + Vite
│   ├── src/
│   │   ├── components/        # Componentes reutilizables
│   │   ├── pages/             # Páginas
│   │   ├── services/          # Acceso a Supabase (catálogo y pedidos)
│   │   ├── store/             # Estado global (Zustand)
│   │   ├── types/             # Tipos de dominio y de la base de datos
│   │   └── utils/             # Helpers y cliente de Supabase
│   └── .env.example           # Variables de entorno documentadas
├── database/
│   ├── supabase/              # Esquema, seed y guía de Supabase
│   └── schema.sql             # Esquema antiguo de PostgreSQL local
├── server/                    # API Express antigua (ya no se usa)
└── package.json               # Scripts del proyecto root
```

## 🚀 Comandos Disponibles

```bash
npm run dev          # Servidor de desarrollo (Vite)
npm run build        # Build de producción
npm run preview      # Previsualizar el build
npm --prefix client run dev
```

## 🔒 Seguridad

- **Row Level Security** activado en todas las tablas.
- El catálogo es de lectura pública; solo un `admin` puede modificarlo.
- Cada cliente solo ve sus propios pedidos.
- Los pedidos se crean con `create_order`, que valida stock y calcula los
  importes en el servidor: el navegador nunca envía precios.
- La clave usada en el cliente es la `publishable`; la `service_role` nunca
  debe exponerse en el frontend.

## 📱 Responsive Design

- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px en adelante

## 📄 Licencia

MIT.

## 👨‍💼 Contacto

Ventas Garzón - info@ventasgarzon.com
