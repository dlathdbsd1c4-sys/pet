import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number.parseInt(process.argv[2] ?? '4175', 10);

const mimeTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.svg', 'image/svg+xml'],
]);

function resolvePath(pathname) {
  const requested = pathname === '/' ? '/preview.html' : pathname;
  const safePath = normalize(decodeURIComponent(requested)).replace(/^(\.\.[/\\])+/, '');
  const absolutePath = join(root, safePath);

  if (!absolutePath.startsWith(root.endsWith(sep) ? root : root + sep)) {
    return join(root, 'preview.html');
  }

  return absolutePath;
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? '/', `http://${request.headers.host}`);
    const filePath = resolvePath(url.pathname);
    const content = await readFile(filePath);
    const contentType = mimeTypes.get(extname(filePath)) ?? 'application/octet-stream';

    response.writeHead(200, {
      'cache-control': 'no-store',
      'content-type': contentType,
    });
    response.end(content);
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Preview ready at http://127.0.0.1:${port}/`);
});
