// Descarga imágenes reales CC0 (vía Openverse) para los productos del catálogo.
// Acepta JPEG/PNG/WebP (detectados por magic bytes) y escribe manifest.json.
// Uso: node scripts/fetch-product-images.mjs
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.resolve('client/public/img/products/real');
const UA_BROWSER =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

// Cada entrada: archivo local, término de búsqueda y preferencias de resultados.
const WANTS = [
  { file: 'shampoo.jpg', q: 'shampoo', picks: [0, 1, 2] },
  { file: 'jabon-bano.jpg', q: 'soap bar', picks: [0, 1, 2] },
  { file: 'pasta-dental.jpg', q: 'toothpaste', picks: [0, 1, 2] },
  { file: 'detergente.jpg', q: 'detergent', picks: [0, 1, 2] },
  { file: 'jabon-lavar.jpg', q: 'laundry soap', picks: [1, 0, 2] },
  { file: 'toallas-humedas.jpg', q: 'tissue paper', picks: [0, 1, 2] },
  { file: 'sponch.jpg', q: 'oreo biscuit', picks: [0, 1, 2] },
  { file: 'pure-tomate.jpg', q: 'tomato puree', picks: [0] },
  { file: 'sopitas.jpg', q: 'noodle soup bowl', picks: [0, 1, 2] },
  { file: 'espaguetis.jpg', q: 'spaghetti pasta', picks: [0, 1, 2] },
  { file: 'arroz.jpg', q: 'rice grains', picks: [0, 1, 2] },
  { file: 'cafe.jpg', q: 'coffee cup beans', picks: [0, 1, 2], source: 'stocksnap' },
];

const EXT_BY_MAGIC = {
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp',
};

function detectImage(buf) {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8) return 'jpeg';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'png';
  if (
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP'
  )
    return 'webp';
  return null;
}

async function searchOne(q, source) {
  const api = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&source=${source}&page_size=6&fields=url,title,creator,foreign_landing_url,license&license_type=commercial`;
  const res = await fetch(api, { headers: { 'User-Agent': 'ventas-garzon-demo/1.0' } });
  if (!res.ok) throw new Error(`Openverse ${res.status}`);
  const data = await res.json();
  return (data.results || []).filter((r) => r.url);
}

async function download(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA_BROWSER } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const kind = detectImage(buf);
  if (!kind) throw new Error('formato no soportado');
  return { buf, kind };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  let manifest = {};
  const manifestPath = path.join(OUT_DIR, 'manifest.json');
  if (existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    } catch {
      manifest = {};
    }
  }

  const report = [];

  for (const want of WANTS) {
    const base = want.file.replace(/\.[^.]+$/, '');
    const existing = existsSync(path.join(OUT_DIR, want.file))
      ? want.file
      : ['jpg', 'png', 'webp']
          .map((ext) => `${base}.${ext}`)
          .find((f) => existsSync(path.join(OUT_DIR, f)));

    if (existing) {
      report.push(`SKIP  ${existing} (ya existe)`);
      continue;
    }

    let ok = false;
    const errors = [];
    try {
      const results = await searchOne(want.q, want.source || 'rawpixel');
      const candidates = want.picks.map((i) => results[i]).filter(Boolean);
      for (const item of candidates) {
        try {
          const { buf, kind } = await download(item.url);
          const fileName = `${base}.${EXT_BY_MAGIC[kind]}`;
          await writeFile(path.join(OUT_DIR, fileName), buf);
          manifest[base] = {
            file: fileName,
            title: item.title || '',
            creator: item.creator || '',
            source: item.foreign_landing_url || item.url,
            license: item.license || 'cc0',
          };
          report.push(`OK    ${fileName}  <-  ${(item.title || item.url).slice(0, 60)}`);
          ok = true;
          break;
        } catch (e) {
          errors.push(`${e.message}`);
        }
      }
    } catch (e) {
      errors.push(`search: ${e.message}`);
    }
    if (!ok) report.push(`FAIL  ${want.file}: ${errors.join(' | ')}`);
  }

  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(report.join('\n'));
  const fails = report.filter((r) => r.startsWith('FAIL')).length;
  console.log(`\n${report.length - fails} listas, ${fails} fallidas.`);
  if (fails > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error('Error fatal:', e.message);
  process.exit(1);
});
