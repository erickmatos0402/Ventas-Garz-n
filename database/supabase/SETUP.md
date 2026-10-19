# Supabase — puesta en marcha

La app (React + Vite) habla **directo con Supabase**: no hay API Express.
Supabase aporta autenticación, base de datos y reglas de acceso (RLS).

## 1. Aplicar el esquema

En el panel del proyecto: **SQL Editor → New query**, pega el contenido de
[`schema.sql`](./schema.sql) y pulsa **Run**. Crea:

- `profiles` — perfil 1:1 con `auth.users` (rol `customer` / `admin`).
- `products` — catálogo del Mercado y la Boutique, con `restock_days`
  (días de espera por abastecimiento).
- `orders` y `order_items` — pedidos e histórico, con recargo por
  transferencia y ventana de recogida (`pickup_ready_at`, 1 hora).
- `product_reviews` — calificaciones y comentarios reales de clientes. Los
  campos `rating` / `reviews` de cada producto se recalculan desde aquí; el
  esquema limpia las valoraciones inventadas de versiones anteriores.
- Políticas RLS: catálogo y reseñas de lectura pública; cada usuario crea,
  edita y borra su propia reseña; pedidos visibles solo para su dueño (o
  admin).
- `create_order(...)` — alta de pedido atómica que valida stock, calcula
  importes (sin impuestos, con 30% de recargo por transferencia), fija la
  ventana de recogida y descuenta unidades.

> Si ya tenías la base creada, vuelve a ejecutar `schema.sql` completo:
> añade las columnas y la tabla nuevas sin borrar datos y recalcula las
> valoraciones desde las reseñas reales.

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
   productos, y fijar los días de espera por abastecimiento.

## 5. Registro de usuarios y confirmación de correo

La app **no impone un límite de cuentas registradas**: cualquiera puede
crear la suya. Si Supabase empieza a rechazar registros por límite de
intentos, entra en **Authentication → Rate Limits** y sube el límite de
**Sign-ups** al máximo permitido por tu plan.

Por defecto Supabase pide confirmar el correo al registrarse. Para probar
sin correo: **Authentication → Providers → Email → Confirm email** (desactivar).
Con la confirmación activada, la app avisa de que revises el correo.

## Notas

- La clave `sb_publishable_...` es pública y puede viajar al navegador.
  **Nunca** pongas la `service_role` en el cliente.
- `schema.sql` es idempotente. Si ya tienes datos y cambias el esquema,
  revisa las migraciones a mano: no borra tablas.
