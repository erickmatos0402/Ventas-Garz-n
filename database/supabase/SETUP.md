# Supabase — puesta en marcha

La app (React + Vite) habla **directo con Supabase**: no hay API Express.
Supabase aporta autenticación, base de datos y reglas de acceso (RLS).

## 1. Aplicar el esquema

En el panel del proyecto: **SQL Editor → New query**, pega el contenido de
[`schema.sql`](./schema.sql) y pulsa **Run**. Crea:

- `profiles` — perfil 1:1 con `auth.users` (rol `customer` / `admin`).
- `products` — catálogo del Mercado y la Boutique.
- `orders` y `order_items` — pedidos e histórico.
- Políticas RLS: catálogo público de lectura, escritura solo para admin,
  pedidos visibles solo para su dueño (o admin).
- `create_order(...)` — alta de pedido atómica que valida stock, calcula
  importes y descuenta unidades.

## 2. Cargar el catálogo

Ejecuta [`seed.sql`](./seed.sql) en el mismo SQL Editor. Solo inserta si
`products` está vacía (22 productos: 10 del Mercado y 12 de la Boutique).

## 3. Variables de entorno

En `client/.env.local` (ignorado por git):

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Puedes copiar `client/.env.example`. Reinicia `npm run dev` después de
cambiar variables: Vite solo las lee al arrancar. En Vercel/hosting,
configúralas también en el panel del proyecto.

## 4. Crear un administrador

1. Regístrate desde `/login` en la app (queda como `customer`).
2. En **SQL Editor**:

```sql
update public.profiles
set role = 'admin'
where email = 'tu@correo.com';
```

3. Vuelve a entrar en `/admin`. El panel ya permite crear, editar y borrar
   productos.

## 5. Confirmación de correo

Por defecto Supabase pide confirmar el correo al registrarse. Para probar
sin correo: **Authentication → Providers → Email → Confirm email** (desactivar).
Con la confirmación activada, la app avisa de que revises el correo.

## Notas

- La clave `sb_publishable_...` es pública y puede viajar al navegador.
  **Nunca** pongas la `service_role` en el cliente.
- `schema.sql` es idempotente. Si ya tienes datos y cambias el esquema,
  revisa las migraciones a mano: no borra tablas.
