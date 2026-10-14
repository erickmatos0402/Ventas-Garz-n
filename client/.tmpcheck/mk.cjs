const fs = require('fs');
const src = fs.readFileSync('src/pages/CartPage.tsx', 'utf8');
const lines = src.split('\n');

// Bloques de comentario JSX que agregué (identificados por su texto)
const drop = new Set();
lines.forEach((l, i) => {
  if (l.includes('En tel') && l.includes('fonos el texto salta de l')) { drop.add(i); drop.add(i + 1); }
  if (l.includes('Miniatura compacta')) { drop.add(i); drop.add(i + 1); }
});
const out = lines.filter((_, i) => !drop.has(i)).join('\n');
fs.writeFileSync('.tmpcheck/t1.tsx', out);
console.log('lineas eliminadas:', drop.size);
