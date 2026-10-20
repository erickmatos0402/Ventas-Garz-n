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
  transferencia y la ventana de recogida de 1 hora elegida por el cliente
  (`pickup_ready_at`).
- `product_reviews` — calificaciones y comentarios reales de clientes. Los
  campos `rating` / `reviews` de cada producto se recalculan desde aquí; el
  esquema limpia las valoraciones inventadas de versiones anteriores.
- Políticas RLS: catálogo y reseñas de lectura pública; cada usuario crea,
  edita y borra su propia reseña; pedidos visibles solo para su dueño (o
  admin).
- `create_order(...)` — alta de pedido atómica que valida stock, calcula
  importes (sin impuestos, con 30% de recargo por transferencia), comprueba
  el rango de 1 hora elegido contra el horario de la tienda (lun a sáb,
  8:00 am – 6:00 pm, hora de Santiago de Cuba) y descuenta unidades.

> Si ya tenías la base creada, vuelve a ejecutar `schema.sql` completo:
> añade las columnas y la tabla nuevas sin borrar datos y recalcula las
> valoraciones desde las reseñas reales.

### Alternativa: ejecutar `schema.sql` desde la terminal

Guarda la conexión directa en `server/.env` (ignorado por git):

```env
SUPABASE_DB_URL=postgresql://postgres:CONTRASEÑA@db.REF.supabase.co:5432/postgres
```

y usa el script incluido:

```bash
cd server
node scripts/apply-schema.cjs check   # prueba la conexión
node scripts/apply-schema.cjs apply   # aplica schema.sql
node scripts/apply-schema.cjs verify  # tablas, columnas, funciones y filas
```

Si `node` no está en el PATH (Git Bash), lámalo a través de npm:
`npm exec --yes -c "node scripts/apply-schema.cjs apply"`.

Dos detalles que ya costaron una tarde:

- El host directo `db.REF.supabase.co` **solo tiene registro AAAA (IPv6)**:
  en una red sin IPv6 falla con `getaddrinfo ENOTFOUND` y el script cae solo
  al pooler IPv4 `aws-0-<región>.pooler.supabase.com:6543` (usuario
  `postgres.REF`).
- El pooler presenta la cadena de certificados propia de Supabase
  (`Supabase Intermediate 2021 CA`), ausente del almacén del sistema: el
  TLS sigue cifrado y el script comprueba que el emisor sea de Supabase Inc
  antes de mandar la contraseña.

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

## 5. Registro de usuarios (sin verificación de correo)

La app **no impone un límite de cuentas registradas**: cualquiera puede
crear la suya. Si Supabase empieza a rechazar registros por límite de
intentos, entra en **Authentication → Rate Limits** y sube el límite de
**Sign-ups** al máximo permitido por tu plan.

**La verificación de correo está desactivada**: el registro entra al
instante. Es un ajuste del proyecto Supabase, no del código: en el panel,
**Authentication → Providers → Email → Confirm email** debe estar
**apagado** (y **Save**). Mientras esté encendido, Supabase no devuelve
sesión y la app muestra el aviso de revisar el correo.

El formulario de registro **solo acepta correos `@gmail.com`** (validado en
`client/src/store/authStore.ts`); el inicio de sesión admite cualquier
correo para no bloquear cuentas creadas antes.

### Si vuelves a activar Confirm email
La app envía en cada registro `emailRedirectTo` con el dominio donde está
abierta (`window.location.origin`), así que el enlace de verificación abre
la URL de producción y no `localhost`. Para que Supabase lo acepte:

1. **Authentication → URL Configuration → Site URL**: pon la URL de
   producción (por ejemplo `https://tu-dominio.vercel.app`).
2. En **Redirect URLs** añade `https://tu-dominio.vercel.app/**`. Si el
   enlace no está en esa lista, Supabase **ignora** el `emailRedirectTo` y
   vuelve al Site URL: por eso antes acababas en localhost.
3. Conserva `http://localhost:5173/**` (y el puerto que uses en `npm run dev`)
   para poder seguir probando el registro en local.

Tras verificar, la app recibe el token en la URL y queda logueada.

## Notas

- La clave `sb_publishable_...` es pública y puede viajar al navegador.
  **Nunca** pongas la `service_role` en el cliente.
- `schema.sql` es idempotente. Si ya tienes datos y cambias el esquema,
  revisa las migraciones a mano: no borra tablas.
