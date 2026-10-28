#!/usr/bin/env node
/* Renders the homepage stamp row's miniatures: every place in timeline/lib/data.js, at each light, cropped with
   LastSeen.stampRect, 144px wide (3x the 48px stamp), to last-seen/stamps/<scene>-<light>.webp.
   Run after adding a place (and after changing a scene's drawing):   node scripts/render-stamps.js [--only=scene-id]
   Needs playwright-core and a Chromium (PLAYWRIGHT_CORE / CHROME env override the defaults). */
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(ROOT, 'last-seen/stamps');
const LIGHTS = ['morning', 'midday', 'golden', 'night'], W = 144;
const only = (process.argv.find(a => a.startsWith('--only=')) || '').slice(7);
let pw; try { pw = require(process.env.PLAYWRIGHT_CORE || 'playwright-core'); } catch (e) { pw = require('/workspace/website-audit/node_modules/playwright-core'); }
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => {
  const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
});
srv.listen(0, '127.0.0.1', async () => {
  const br = await pw.chromium.launch(process.env.CHROME || fs.existsSync('/usr/bin/google-chrome') ? { executablePath: process.env.CHROME || '/usr/bin/google-chrome' } : {});
  const pg = await br.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(`http://127.0.0.1:${srv.address().port}/scripts/stamps-harness.html`);
  await pg.waitForFunction(() => window.sceneIds && window.TL2 && sceneIds().length === TL2.places().length, null, { timeout: 15000 }).catch(() => {});
  await pg.evaluate(() => document.fonts.ready);
  fs.mkdirSync(OUT, { recursive: true });
  const ids = (await pg.evaluate(() => sceneIds())).filter(id => !only || id === only);
  for (const id of ids) for (const L of LIGHTS) {
    const u = await pg.evaluate(([i, l, w]) => stamp(i, l, w), [id, L, W]);
    fs.writeFileSync(path.join(OUT, `${id}-${L}.webp`), Buffer.from(u.split(',')[1], 'base64'));
  }
  console.log(`${ids.length} places x ${LIGHTS.length} lights -> last-seen/stamps/`); if (errs.length) { console.error(errs); process.exitCode = 1; }
  await br.close(); srv.close();
});
