// 개발용 정적 서버. 모듈은 file:// 주소에서 열리지 않으므로 이걸로 띄운다.
//   npm run dev            → http://localhost:5173
//   npm run dev -- 8080    → 다른 포트
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.argv[2]) || 5173;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };

http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const file = path.join(root, pathname.endsWith('/') ? pathname + 'index.html' : pathname);
  // 저장소 밖이나 숨김 파일(.git, .env 등)은 내주지 않는다.
  if (!file.startsWith(root + path.sep) || path.relative(root, file).split(path.sep).some((part) => part.startsWith('.'))) { response.writeHead(403).end('Forbidden'); return; }
  fs.readFile(file, (error, body) => {
    if (error) { response.writeHead(404).end('Not found'); return; }
    response.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' }).end(body);
  });
}).listen(port, '127.0.0.1', () => console.log(`혈압 트랙: http://localhost:${port}`));
