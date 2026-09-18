// usage: node cdpshot.mjs <outdir> <base> name=query ...   — exact 390x844 viewport at 1.5x via DevTools protocol
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
const [outDir, base, ...pairs] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const CH = `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1140/chrome-mac/Chromium.app/Contents/MacOS/Chromium`;
const port = 9333 + Math.floor(Math.random() * 100);
const chrome = spawn(CH, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--remote-allow-origins=*', `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/cdpshot-profile-${port}`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 40; i++) { try { const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); target = list.find((t) => t.type === 'page'); if (target) break; } catch {} await sleep(250); }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.addEventListener("open", r); ws.addEventListener("error", (e) => j(new Error("ws error"))); setTimeout(() => j(new Error("ws timeout")), 8000); });
let id = 0; const waiting = new Map();
ws.addEventListener('message', (m) => { const msg = JSON.parse(m.data); if (msg.id && waiting.has(msg.id)) { waiting.get(msg.id)(msg.result); waiting.delete(msg.id); } });
const send = (method, params = {}) => new Promise((r, j) => { const n = ++id; waiting.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); setTimeout(() => { if (waiting.has(n)) { waiting.delete(n); j(new Error(method + ' timed out')); } }, 12000); });
await send('Page.enable'); await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1.5, mobile: true });
for (const pair of pairs) {
  const [name, query] = pair.split('=', 2).length === 2 ? [pair.slice(0, pair.indexOf('=')), pair.slice(pair.indexOf('=') + 1)] : [pair, ''];
  await send('Page.navigate', { url: `${base}?r=${Date.now()}&${query}` });
  await sleep(1400);
  for (let w = 0; w < 10; w++) { const r = await send('Runtime.evaluate', { expression: "!!document.querySelector('.bl-phone') && document.querySelector('.bl-phone').children.length > 0", returnByValue: true }); if (r && r.result && r.result.value) break; await sleep(500); }
  let shot; for (let t = 0; t < 3; t++) { try { shot = await send('Page.captureScreenshot', { format: 'png' }); break; } catch (e) { await sleep(800); } }
  if (!shot) { process.stdout.write(`[${name} failed] `); continue; }
  writeFileSync(`${outDir}/${name}.png`, Buffer.from(shot.data, 'base64'));
  process.stdout.write(`${name} `);
}
console.log(); ws.close(); chrome.kill(); process.exit(0);
