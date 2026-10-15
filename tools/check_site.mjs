import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, relative, join } from 'node:path';
import assert from 'node:assert/strict';
import { validateOntology } from './ontology_validation.mjs';

const root = resolve('dist');
const base = `/${(process.env.BASE_PATH || '/').replace(/^\/+|\/+$/g, '')}`.replace(/\/$/, '') + '/';
const errors = [];
let pages = 0;
async function check(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) { await check(file); continue; }
    if (!entry.name.endsWith('.html')) continue;
    pages++;
    const html = await readFile(file, 'utf8');
    const page = new URL(base + relative(root, file).replaceAll('\\', '/'), 'https://site.invalid');
    for (const [, attribute] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const url = new URL(attribute.replaceAll('&amp;', '&'), page);
      if (url.origin !== page.origin) continue;
      if (!url.pathname.startsWith(base)) { errors.push(`${file}: outside base ${attribute}`); continue; }
      const local = resolve(root, decodeURIComponent(url.pathname.slice(base.length)));
      try {
        const info = await stat(local);
        if (info.isDirectory()) await stat(join(local, 'index.html'));
      } catch { errors.push(`${relative(root, file)}: missing ${attribute}`); }
    }
  }
}
await check(root);
const data = validateOntology(JSON.parse(await readFile(join(root, 'graph-assets/ontology.json'), 'utf8')));
assert.deepEqual(data, JSON.parse(await readFile('public/graph-assets/ontology.json', 'utf8')), 'Astro must preserve the generated graph data');
const graph = await readFile(join(root, 'graph/index.html'), 'utf8');
assert(graph.includes(`content="${base}graph-assets/ontology.json"`), 'graph endpoint must honor the base path');
assert(!graph.includes('<iframe'), 'graph must be a native page');
assert.equal(errors.length, 0, errors.join('\n'));
console.log(`Checked ${pages} static pages, local links, subpath graph endpoint, and exact graph data parity.`);
