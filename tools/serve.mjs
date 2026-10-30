// Servidor estático mínimo para rodar o Arcade localmente (auditoria e testes).
// Node puro, sem dependências. Uso: node tools/serve.mjs [porta]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.argv[2] || 8099);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.ico': 'image/x-icon',
};

// As funções de `api/` só existem na Vercel. Para poder clicar no PLAYER+ de verdade num navegador
// local, este servidor chama O MESMO arquivo que a Vercel chamaria — nada de uma segunda
// implementação de mentira que poderia passar enquanto a de produção falha.
//
// O código de ativação vem do ambiente, ou de `.env.player-plus` na raiz (ignorado pelo git). Ele não
// entra no repositório em nenhuma das duas formas.
if (!process.env.PLAYER_PLUS_CODE || !process.env.PLAYER_PLUS_SECRET) {
  try {
    for (const linha of fs.readFileSync(path.join(ROOT, '.env.player-plus'), 'utf8').split('\n')) {
      const m = linha.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch (_) { /* sem arquivo: a função responde "not-configured", que é a verdade */ }
}
const playerPlus = (await import('../api/player-plus.mjs')).default;

http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (pathname === '/api/player-plus') { playerPlus(req, res); return; }
  let file = path.join(ROOT, pathname);
  if (!path.resolve(file).startsWith(ROOT)) { res.writeHead(403).end('fora da raiz'); return; }
  try { if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html'); } catch (_) {}
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }).end('404'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
}).listen(PORT, '127.0.0.1', () => console.log(`arcade em http://127.0.0.1:${PORT}/`));
