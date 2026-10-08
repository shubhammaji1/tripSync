const { build } = require('esbuild');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '../..');
const out = path.join(__dirname, '.build');
const webRequire = createRequire(path.join(root, 'apps/web/package.json'));
(async () => {
  fs.mkdirSync(out, { recursive: true });
  await build({ entryPoints: [path.join(__dirname, 'fixture.tsx')], bundle: true, outdir: out, platform: 'browser', jsx: 'automatic', loader: { '.png': 'dataurl' }, nodePaths: [path.join(root, 'apps/web/node_modules')], alias: { '@': path.join(root, 'apps/web/src') }, define: { 'process.env.NEXT_PUBLIC_API_URL': '"http://127.0.0.1:4173/api/v1"', 'process.env.NODE_ENV': '"development"' } });
  await build({ entryPoints: [path.join(__dirname, 'trip-fixture.tsx')], bundle: true, outdir: out, platform: 'browser', jsx: 'automatic', nodePaths: [path.join(root, 'apps/web/node_modules')], alias: { '@': path.join(root, 'apps/web/src'), '@clerk/nextjs': path.join(__dirname, 'mock-clerk.tsx'), 'next/navigation': path.join(__dirname, 'mock-navigation.ts'), 'next/link': path.join(__dirname, 'mock-link.tsx') }, define: { 'process.env': '{}', 'process.env.NEXT_PUBLIC_API_URL': '"http://127.0.0.1:4173/api/v1"', 'process.env.NODE_ENV': '"development"' } });
  const config = require(path.join(root, 'apps/web/tailwind.config.js'));
  config.content = [path.join(root, 'apps/web/src/**/*.{ts,tsx}').replaceAll('\\', '/'), path.join(__dirname, '*.tsx').replaceAll('\\', '/')];
  const css = await webRequire('postcss')([webRequire('tailwindcss')(config)]).process('@tailwind base; @tailwind components; @tailwind utilities;', { from: undefined });
  fs.writeFileSync(path.join(out, 'styles.css'), css.css);
  http.createServer((req, res) => {
    const name = req.url.split('?')[0];
    if (name === '/trip') { res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><html><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/styles.css"><body><div id="root"></div><script src="/trip-fixture.js"></script></body></html>'); return; }
    if (name === '/') { res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><html><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/fixture.css"><body style="background:#f8fafc;color:#0f172a"><div id="root"></div><script src="/fixture.js"></script></body></html>'); return; }
    const file = path.join(out, path.basename(name));
    if (!fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
    res.setHeader('Content-Type', name.endsWith('.css') ? 'text/css' : 'application/javascript');
    res.end(fs.readFileSync(file));
  }).listen(4173, '127.0.0.1');
})().catch(error => { console.error(error); process.exit(1); });
