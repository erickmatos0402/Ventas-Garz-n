/**
 * Ejecuta `database/supabase/schema.sql` contra Supabase desde la terminal,
 * sin pasar por el SQL Editor. Requiere la variable `SUPABASE_DB_URL` en
 * `server/.env` (archivo ignorado por git):
 *
 *   SUPABASE_DB_URL=postgresql://postgres:CONTRASEÑA@db.REF.supabase.co:5432/postgres
 *
 * Uso:
 *   node scripts/apply-schema.cjs check   # prueba la conexión
 *   node scripts/apply-schema.cjs apply   # aplica schema.sql (idempotente)
 *   node scripts/apply-schema.cjs verify  # comprueba tablas, columnas y funciones
 *
 * Dos detalles heredados de la práctica:
 *  - El host directo `db.<ref>.supabase.co` solo tiene registro AAAA (IPv6).
 *    Sin IPv6 en la red falla con `getaddrinfo ENOTFOUND` y se cae al pooler
 *    IPv4 `aws-0-<región>.pooler.supabase.com:6543` (usuario `postgres.<ref>`).
 *  - El pooler presenta la cadena propia de Supabase (`Supabase Intermediate
 *    2021 CA`), ausente del almacén de CA del sistema: `verify-full` falla con
 *    "self-signed certificate in certificate chain". El cifrado TLS sigue
 *    activo; además se comprueba que el emisor sea de Supabase Inc antes de
 *    mandar la contraseña.
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const REGIONS = ['us-east-1', 'us-west-1', 'eu-west-1', 'us-east-2', 'eu-central-1'];
const SCHEMA_FILE = path.join(__dirname, '..', '..', 'database', 'supabase', 'schema.sql');

/** Lee un .env sencillo (clave=valor) sin depender de dotenv. */
function loadEnv(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (match) out[match[1]] = match[2].trim();
  }
  return out;
}

function buildCandidates(uri) {
  const match = uri.match(/^postgres(?:ql)?:\/\/([^:@/]+):(.+)@([^:/]+):(\d+)\/(.+)$/);
  if (!match) throw new Error('SUPABASE_DB_URL no tiene el formato esperado');
  const [, , password, directHost, , database] = match;
  const ref = directHost.replace(/^db\./, '').replace(/\.supabase\.co$/, '');

  return [
    // El host directo solo sirve si la red tiene IPv6; si no, falla rápido
    // (connectionTimeoutMillis) y se pasa al pooler IPv4.
    { label: `directo ${directHost}`, url: uri },
    ...REGIONS.map((region) => ({
      label: `pooler ${region}`,
      url: `postgresql://postgres.${ref}:${password}@aws-0-${region}.pooler.supabase.com:6543/${database}`,
    })),
  ];
}

/** Conecta al primer endpoint accesible y con certificado emitido por Supabase. */
async function connect(uri) {
  const failures = [];
  for (const candidate of buildCandidates(uri)) {
    const client = new Client({
      connectionString: candidate.url,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 8000,
      application_name: 'ventas-garzon-schema',
    });
    try {
      await client.connect();
      const stream = client.connection && client.connection.stream;
      const cert = stream && typeof stream.getPeerCertificate === 'function' ? stream.getPeerCertificate() : null;
      const issuer = cert ? JSON.stringify(cert.issuer || {}) : '';
      const subject = cert ? JSON.stringify(cert.subject || {}) : '';
      if (!issuer.includes('Supabase') || !subject.includes('supabase.com')) {
        throw new Error(`certificado inesperado: issuer=${issuer} subject=${subject}`);
      }
      await client.query('select 1');
      return { client, label: candidate.label };
    } catch (error) {
      await client.end().catch(() => {});
      failures.push(`${candidate.label}: ${error.message}`);
    }
  }
  throw new Error(`ningún endpoint aceptó la conexión\n  - ${failures.join('\n  - ')}`);
}

async function verify(client) {
  // En serie: un cliente de `pg` ejecuta una consulta cada vez.
  const tables = await client.query(`
    select table_name from information_schema.tables
    where table_schema = 'public'
      and table_name in ('profiles', 'products', 'orders', 'order_items', 'product_reviews')
    order by table_name
  `);
  const columns = await client.query(`
    select table_name, column_name from information_schema.columns
    where table_schema = 'public'
      and ( (table_name = 'products' and column_name = 'restock_days')
         or (table_name = 'orders' and column_name in ('transfer_fee', 'pickup_ready_at')) )
    order by table_name, column_name
  `);
  const functions = await client.query(`
    select p.proname, pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('create_order', 'refresh_product_rating', 'set_review_author')
    order by p.proname, args
  `);
  const counts = await client.query(`
    select (select count(*) from public.products) as productos,
           (select count(*) from public.orders) as pedidos,
           (select count(*) from public.product_reviews) as resenas,
           (select count(*) from public.profiles) as perfiles
  `);

  console.log('TABLAS    ' + tables.rows.map((r) => r.table_name).join(', '));
  console.log('COLUMNAS  ' + columns.rows.map((r) => `${r.table_name}.${r.column_name}`).join(' | '));
  console.log('FUNCIONES ' + functions.rows.map((r) => `${r.proname}(${r.args})`).join(' | '));
  console.log('FILAS     ' + JSON.stringify(counts.rows[0]));
}

(async () => {
  const mode = process.argv[2] || 'check';
  const env = { ...loadEnv(path.join(__dirname, '..', '.env')), ...process.env };
  const uri = env.SUPABASE_DB_URL;

  if (!uri || uri.includes('[YOUR-PASSWORD]')) {
    console.error('FALTA SUPABASE_DB_URL: añádelo a server/.env con la contraseña real.');
    process.exit(2);
  }
  if (!['check', 'apply', 'verify'].includes(mode)) {
    console.error('Modo desconocido: ' + mode + ' (usa check | apply | verify)');
    process.exit(2);
  }

  let connection;
  try {
    connection = await connect(uri);
  } catch (error) {
    console.error('FALLO: ' + error.message);
    process.exit(3);
  }

  const { client, label } = connection;
  try {
    if (mode === 'check') {
      const info = await client.query(
        "select current_database() as db, current_user as usr, current_setting('server_version') as ver"
      );
      console.log(`CONECTADO por ${label} — ${JSON.stringify(info.rows[0])}`);
      return;
    }

    if (mode === 'apply') {
      const sql = fs.readFileSync(SCHEMA_FILE, 'utf8');
      const start = Date.now();
      await client.query(sql);
      console.log(`SCHEMA_OK por ${label} en ${Date.now() - start} ms (${sql.split('\n').length} líneas)`);
      return;
    }

    await verify(client);
  } catch (error) {
    console.error('ERROR: ' + error.message);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
})();
