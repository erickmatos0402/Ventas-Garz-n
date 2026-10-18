# Ventas Garzón - Guía de Desarrollo

## 🚀 Quick Start

```bash
# 1. Dependencias
npm install
npm --prefix client install

# 2. Base de datos (una sola vez, en el SQL Editor de Supabase)
#    - database/supabase/schema.sql
#    - database/supabase/seed.sql

# 3. Variables de entorno
cp client/.env.example client/.env.local
# Edita client/.env.local con la URL y la publishable key del proyecto

# 4. Desarrollo
npm run dev
```

Frontend: http://localhost:3000

No hay backend local: el cliente React habla directo con Supabase.

## 📦 Scripts Disponibles

### Root

```bash
npm run dev          # Vite dev server
npm run client       # Igual que dev
npm run build        # Build de producción
npm run preview      # Previsualizar el build
```

### Client

```bash
npm run dev          # Vite dev server
npm run build        # Build producción
npm run preview      # Preview del build
```

## 🔄 Flujo de trabajo

1. `npm run dev` arranca Vite (puerto 3000).
2. Al montar, la app restaura la sesión (`authStore.initialize`) y carga el
   catálogo (`catalogStore.fetchProducts`).
3. Los cambios en `client/src` se recargan en caliente.
4. Si tocas variables de entorno, reinicia Vite.

## 🗃️ Acceso a datos

| Dominio | Archivo | Notas |
| --- | --- | --- |
| Cliente Supabase | `client/src/utils/supabase.ts` | Cliente único y tipado |
| Catálogo | `client/src/services/catalog.ts` | `list`, `create`, `update`, `remove` |
| Pedidos | `client/src/services/orders.ts` | Llama a la RPC `create_order` |
| Estado | `client/src/store/catalogStore.ts` | Zustand sin persistencia local |
| Sesión | `client/src/store/authStore.ts` | Supabase Auth + tabla `profiles` |
| Tipos | `client/src/types/database.ts` | Espejo manual del esquema |

### Reglas de acceso (RLS)

- `products`: lectura pública; escritura solo si `profiles.role = 'admin'`.
- `orders` / `order_items`: cada usuario ve los suyos; el admin ve todos.
- Los pedidos **no** se insertan desde el cliente: se usa la función
  `create_order`, que valida stock y calcula los importes.

### Cambios de esquema

1. Edita `database/supabase/schema.sql` (idempotente).
2. Ejecútalo de nuevo en el SQL Editor.
3. Actualiza `client/src/types/database.ts` y, si hace falta, los mapeadores
   de `client/src/services/catalog.ts`.

## 🧪 Verificación

```bash
# Typecheck
cd client && npx tsc --noEmit -p tsconfig.json

# Build
npm run build
```

## 🗂️ Estructura

```
client/src/
├── components/   # UI reutilizable
├── pages/        # Rutas de react-router
├── services/     # Supabase (catálogo, pedidos)
├── store/        # Zustand (carrito, catálogo, sesión, tema)
├── types/        # Dominio + Database
└── utils/        # Cliente Supabase, formateadores, animaciones
```

## ⚠️ Notas

- `server/` es la API Express antigua y ya no se usa; puede eliminarse.
- No expongas la `service_role` de Supabase en el cliente.
- Los precios se guardan en pesos enteros (`integer`).
