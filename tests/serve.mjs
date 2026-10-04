// 저장소를 GitHub Pages와 같은 하위 주소(/vibe-vocab-lab/)로 띄우는 작은 정적 서버
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PREFIX = '/vibe-vocab-lab/';
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.png': 'image/png', '.md': 'text/markdown; charset=utf-8'
};

export function startServer(port = 8765) {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    if (!url.pathname.startsWith(PREFIX)) { res.writeHead(404); return res.end('not found'); }
    let rel = decodeURIComponent(url.pathname.slice(PREFIX.length));
    let file = normalize(join(ROOT, rel));
    if (!file.startsWith(normalize(ROOT))) { res.writeHead(403); return res.end(); }
    try {
      if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404); res.end('not found');
    }
  });
  return new Promise(resolve => server.listen(port, '127.0.0.1', () => resolve(server)));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 8765);
  await startServer(port);
  console.log(`http://127.0.0.1:${port}${PREFIX}`);
}
