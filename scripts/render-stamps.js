#!/usr/bin/env node
/* Renders the homepage stamp row's miniatures: every place in timeline/lib/data.js, at each light, cropped with
   LastSeen.stampRect, 144px wide (3x the 48px stamp), to last-seen/stamps/<scene>-<light>.webp.
   With --stills it also writes the Timeline's pictures of the whole scene: timeline/img/<scene>-<light>-s.webp (160px) and -l.webp (1344px).
   Run after adding a place (and after changing a scene's drawing):   node scripts/render-stamps.js [--only=scene-id] [--stills]
   Needs playwright-core and a Chromium (PLAYWRIGHT_CORE / CHROME env override the defaults). On a Mac:
     npm install --no-save --cache /tmp/npm-cache playwright-core
     CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" node scripts/render-stamps.js --only=<scene-id> --stills */
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(ROOT, 'last-seen/stamps');
const LIGHTS = ['morning', 'midday', 'golden', 'night'], W = 144;
const only = (process.argv.find(a => a.startsWith('--only=')) || '').slice(7), stills = process.argv.includes('--stills'), IMG = path.join(ROOT, 'timeline/img');
let pw; try { pw = require(process.env.PLAYWRIGHT_CORE || 'playwright-core'); } catch (e) { pw = require('/workspace/website-audit/node_modules/playwright-core'); }
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => {
  const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
});
srv.listen(0, '127.0.0.1', async () => {
  const MAC = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', exe = process.env.CHROME || ['/usr/bin/google-chrome', MAC].find(f => fs.existsSync(f));
  const br = await pw.chromium.launch(exe ? { executablePath: exe } : {});
  const pg = await br.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(`http://127.0.0.1:${srv.address().port}/scripts/stamps-harness.html`);
  await pg.waitForFunction(() => window.sceneIds && window.TL2 && sceneIds().length === TL2.places().length, null, { timeout: 15000 }).catch(() => {});
  await pg.evaluate(() => document.fonts.ready);
  fs.mkdirSync(OUT, { recursive: true });
  const ids = (await pg.evaluate(() => sceneIds())).filter(id => !only || id === only);
  for (const id of ids) for (const L of LIGHTS) {
    const u = await pg.evaluate(([i, l, w]) => stamp(i, l, w), [id, L, W]);
    fs.writeFileSync(path.join(OUT, `${id}-${L}.webp`), Buffer.from(u.split(',')[1], 'base64'));
    if (stills) for (const [sz, w, q] of [['s', 160, 0.8], ['l', 1344, 0.82]]) {
      const v = await pg.evaluate(([i, l, ww, qq]) => still(i, l, ww, qq), [id, L, w, q]);
      fs.writeFileSync(path.join(IMG, `${id}-${L}-${sz}.webp`), Buffer.from(v.split(',')[1], 'base64'));
    }
  }
  console.log(`${ids.length} places x ${LIGHTS.length} lights -> last-seen/stamps/` + (stills ? ' and timeline/img/' : '')); if (errs.length) { console.error(errs); process.exitCode = 1; }
  await br.close(); srv.close();
});
