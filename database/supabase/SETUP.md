# Supabase — puesta en marcha

La app (React + Vite) habla **directo con Supabase**: no hay API Express.
Supabase aporta autenticación, base de datos y reglas de acceso (RLS).

## 1. Aplicar el esquema

En el panel del proyecto: **SQL Editor → New query**, pega el contenido de
[`schema.sql`](./schema.sql) y pulsa **Run**. Crea:

- `profiles` — perfil 1:1 con `auth.users` (rol `customer` / `admin`).
- `products` — catálogo del Mercado y la Boutique, con `restock_days`
  (días de espera por abastecimiento).
- `orders` y `order_items` — pedidos e histórico, con la tienda del pedido
  (`store`: `market` o `boutique`), recargo por transferencia y la ventana de
  recogida de 1 hora elegida por el cliente (`pickup_ready_at`).
- `product_reviews` — calificaciones y comentarios reales de clientes. Los
  campos `rating` / `reviews` de cada producto se recalculan desde aquí; el
  esquema limpia las valoraciones inventadas de versiones anteriores.
- Políticas RLS: catálogo y reseñas de lectura pública; cada usuario crea,
  edita y borra su propia reseña; pedidos visibles solo para su dueño (o
  admin).
- `create_order(...)` — alta de pedido atómica que valida stock, calcula
  importes (sin impuestos, con 30% de recargo por transferencia), comprueba
  el rango de 1 hora elegido contra el horario de la tienda (lun a sáb,
  8:00 am – 6:00 pm, hora de Santiago de Cuba) y descuenta unidades. Un
  pedido pertenece a una sola tienda: no se mezclan productos de Mercado y
  Boutique.

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

### Variables del servidor (Vercel)

El endpoint `client/api/register.js` crea la cuenta **ya confirmada** (sin
correo de verificación) usando la clave de servicio, que nunca llega al
navegador. En **Vercel → Project → Settings → Environment Variables** añade
(para Production y Preview) y vuelve a desplegar:

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...   # Project Settings → API Keys
```

Si falta alguna, el endpoint responde 501 y la app cae en el registro normal
de Supabase (que pide confirmar el correo).

Si Supabase responde **401 «Invalid API key»**, el valor pegado no encaja con
el proyecto: revisa que la clave sea la de servicio (**empieza por
`sb_secret_`**, no la publicable `sb_publishable_…`), del **mismo proyecto**
que `SUPABASE_URL`, y sin comillas ni espacios alrededor. El endpoint ya
limpia comillas y espacios; si sigue fallando, la app sigue registrando por
la vía normal de Supabase.

### Registro sin correo de confirmación (función `/api/register`)

El registro normal de Supabase envía un correo mientras «Confirm email»
esté activo, y esa casilla solo se cambia en el panel. Para que la cuenta
entre al instante **sin depender de ese ajuste**, la app incluye
`client/api/register.js`: crea la cuenta ya confirmada con la Admin API y
el cliente inicia sesión con la contraseña. La clave de servicio **nunca**
llega al navegador.

En Vercel: **Settings → Environment Variables** (Production y Preview):

```env
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role o sb_secret_...>
```

Después, **Redeploy**. Si esas variables faltan, el endpoint responde 501 y
la app cae en el registro normal de Supabase (funciona, pero vuelve a
enviar el correo si «Confirm email» está encendido).

> La `service_role` salta RLS: mantenla solo en el servidor. Rótala si
> alguna vez se pegó en un chat o en el código.

También puedes apagar del todo **Authentication → Providers → Email →
Confirm email** (y **Save**): entonces `signUp` devuelve sesión y ni
siquiera hace falta el endpoint.

## 4. Crear un administrador

1. Regístrate desde `/login` en la app (queda como `customer`).
2. En **SQL Editor**:

```sql
update public.profiles
set role = 'admin'
where email = 'tu@correo.com';
```

3. Vuelve a entrar en `/admin`. El panel tiene dos tiendas independientes
   (**Mercado** y **Boutique**): catálogo, pedidos y gráficos de cada una
   se gestionan por separado.
   - **Productos**: crear, editar y borrar artículos, con días de espera.
   - **Pedidos**: lista con cliente, artículos, teléfono y hora de recogida;
     botones **Entregado** y **Cancelar** para llevar el control.
   - **Gráficos**: ingresos y ventas confirmadas (solo pedidos entregados)
     con vista diaria (14 días), semanal (8 semanas) y mensual (6 meses).

## 4.1 Acceso con Google y Apple (iCloud)

Los botones **Continuar con Google** y **Continuar con Apple (iCloud)** ya
están en la pantalla de acceso (Apple solo se muestra en iPhone, iPad y Mac).
Para activarlos sigue los pasos **6.1 Google** y **6.2 Apple** de más abajo;
hasta entonces los botones devuelven el error del proveedor y el registro
con correo y contraseña sigue funcionando igual.

## 4.2 Instalar la web como app (icono del logo)

`client/public/manifest.webmanifest` + `client/public/icons/*` usan el logo
real (`logo.jpg`) como icono. En iPhone/iPad: Safari → Compartir → **Añadir
a pantalla de inicio**. En Android/Chrome: menú → **Instalar aplicación**.
El service worker (`client/public/sw.js`) es mínimo y no cachea, así cada
despliegue se ve al día. Todo se sirve sobre HTTPS.

## 5. Registro de usuarios (sin verificación de correo)

La app **no impone un límite de cuentas registradas**: cualquiera puede
crear la suya. Si Supabase empieza a rechazar registros por límite de
intentos, entra en **Authentication → Rate Limits** y sube el límite de
**Sign-ups** al máximo permitido por tu plan.

Al confirmar el registro, el mensaje de éxito se muestra en **verde**
(`client/src/pages/AuthPage.tsx`), nunca como error en rojo. Si por algún
motivo Supabase sigue exigiendo confirmar el correo, el aviso también es
verde y explica que revises la bandeja.

El formulario de registro **solo acepta correos `@gmail.com`** (validado en
`client/src/store/authStore.ts` y en el endpoint `api/register.js`); el
inicio de sesión admite cualquier correo para no bloquear cuentas creadas
antes.

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

## 6. Iniciar sesión con Google y con Apple (iCloud)

La pantalla de acceso ya tiene los dos botones. **"Continuar con Google"**
aparece siempre; **"Continuar con Apple (iCloud)"** solo en iPhone, iPad y Mac
(la app lo detecta por el navegador). Para que funcionen hay que activar los
proveedores en Supabase: con ellos apagados, el botón devuelve un error.

### 6.1 Google

1. Entra en [Google Cloud Console](https://console.cloud.google.com/) y crea
   un proyecto (o usa el que ya tienes).
2. En **APIs & Services → Credentials → Create credentials → OAuth client ID**
   elige **Web application**.
   - **Authorized JavaScript origins**: `https://tu-dominio` (por ejemplo
     `https://tu-app.vercel.app`) y `http://localhost:5173` para pruebas locales.
   - **Authorized redirect URIs**:
     `https://TU_REF.supabase.co/auth/v1/callback` (sustituye `TU_REF` por el
     identificador de tu proyecto, aparece en la URL del panel de Supabase).
3. Copia el **Client ID** y el **Client Secret**.
4. En Supabase: **Authentication → Providers → Google**, activa el interruptor
   y pega el Client ID y el Client Secret. **Save**.
5. Comprueba que en **Authentication → URL Configuration** está tu URL de
   producción en *Site URL* y que tu dominio está en *Redirect URLs*
   (`https://tu-dominio/**` y `http://localhost:5173/**`).

### 6.2 Apple (iCloud)

Requiere una cuenta de **Apple Developer Program** (de pago):

1. En [developer.apple.com](https://developer.apple.com/) → **Certificates,
   Identifiers & Profiles → Identifiers → Services IDs → +** → activa la
   casilla **Sign in with Apple** y registra un identificador, por ejemplo
   `com.ventasgarzon.app`. Anota el **Team ID** y el **Service ID**.
2. En **Keys → +** → **Sign in with Apple** → descarga el archivo `.p8` y anota
   el **Key ID**.
3. En Supabase: **Authentication → Providers → Apple**, activa el interruptor y
   rellena:
   - **Client ID**: el Service ID (`com.ventasgarzon.app`).
   - **Client Secret**: pulsa **"Generate secret"** en ese mismo panel
     (Supabase lo crea con tu Team ID, Key ID y la clave `.p8`).
4. Guarda. Las mismas *Redirect URLs* que en Google.

### 6.3 Validar que funciona (checklist)

1. **URLs de retorno en Supabase**: *Authentication → URL Configuration*.
   *Site URL* = dominio de producción y en *Redirect URLs* deben estar
   `https://tu-dominio/**` **y** `http://localhost:5173/**` (con el puerto
   real de `npm run dev`). Sin esta lista Supabase ignora el `redirectTo`.
2. **Google**: en el cliente OAuth de Google Cloud, *Authorized JavaScript
   origins* lleva el dominio de la app (no la URL de Supabase) y *Authorized
   redirect URIs* lleva `https://TU_REF.supabase.co/auth/v1/callback`.
3. **Apple**: el *Service ID* y el *Return URL*
   (`https://TU_REF.supabase.co/auth/v1/callback`) deben coincidir con lo
   registrado en Apple Developer. El *Client Secret* generado en Supabase
   caduca a los 6 meses: si Apple deja de responder, vuelve a generarlo.
4. **Proveedor activo**: *Authentication → Providers → Google/Apple* con el
   interruptor en verde y **Save** (guardar de nuevo nunca estorba).
5. **Prueba real**: abre `/login` en una ventana privada, pulsa el botón y
   confirma que vuelves a la tienda con tu nombre en la barra. Si falla, la
   propia pantalla de acceso muestra ahora el mensaje que devuelve Supabase
   (por ejemplo, «provider is not enabled»), y en **Supabase → Logs → Auth**
   queda el detalle del proveedor.

Recuerda que **Apple solo aparece en iPhone, iPad y Mac**; en Windows o
Android es normal no ver ese botón.

## 7. Instalar la app en el teléfono (PWA)

La web ya es instalable: `client/public/manifest.webmanifest` (con el logo en
192, 512 y maskable), `client/public/sw.js` (service worker) y los enlaces en
`client/index.html`.

- **Android / Chrome**: menú ⋮ → **"Instalar app"**.
- **iPhone / Safari**: botón Compartir → **"Añadir a pantalla de inicio"**.

En Vercel no hay que hacer nada más: `sw.js` y `manifest.webmanifest` se
sirven como archivos estáticos (el `rewrite` a `index.html` solo afecta a las
rutas de la app). Comprueba que en el despliegue `/sw.js` y
`/manifest.webmanifest` devuelven 200 y no el HTML de la app.

## Notas

- La clave `sb_publishable_...` es pública y puede viajar al navegador.
  **Nunca** pongas la `service_role` en el cliente.
- `schema.sql` es idempotente. Si ya tienes datos y cambias el esquema,
  revisa las migraciones a mano: no borra tablas.
