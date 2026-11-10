import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const workspace = fileURLToPath(new URL('../../', import.meta.url));
const rootPaths = new Map([
  ['workplace', 'workplace'], ['qq-show-classic', 'qq-show-classic'], ['qq-show-fashion', 'qq-show-fashion'],
  // Frozen review documents retain their original URLs after the physical move.
  ['LLM-show-classic', 'workplace/LLM-show-classic'], ['LLM-show-fashion', 'workplace/LLM-show-fashion'],
  ['frontend', 'workplace/frontend'],
]);
const types = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.md':'text/plain; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif','.svg':'image/svg+xml','.txt':'text/plain; charset=utf-8'};

// Serve current workspace paths and keep frozen documents' former URLs valid.
export function workspaceFiles({runtimeRoot, extraRuntimePaths = []} = {}) {
  const runtimePaths = new Set(['ai', 'native', 'native-contact', 'review-rounds', 'rating-rules', 'reference-20-looks', 'references', 'catalog.json', 'review-session.json', 'reviews.json', 'review-protocol.md', 'native-availability.json', ...extraRuntimePaths]);
  function middleware(req, res, next) {
    if (!['GET', 'HEAD'].includes(req.method)) return next();
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
    catch { res.statusCode = 400; return res.end(); }
    const parts = pathname.slice(1).split('/');
    const runtimeFile = runtimeRoot && runtimePaths.has(parts[0]);
    if (!rootPaths.has(parts[0]) && !runtimeFile) return next();
    const workplaceRoute = parts[0] === 'workplace';
    if (workplaceRoute && !['frontend', 'LLM-show-classic', 'LLM-show-fashion'].includes(parts[1])) return next();
    if (parts.some(part => part === '..' || part.includes('\\') || part.includes('\0'))) {
      res.statusCode = 400; return res.end();
    }
    const allowed = runtimeFile ? path.resolve(runtimeRoot) : path.resolve(workspace, rootPaths.get(parts[0]), ...(workplaceRoute ? [parts[1]] : []));
    let file = runtimeFile ? path.resolve(allowed, '.' + pathname) : path.resolve(allowed, ...parts.slice(workplaceRoute ? 2 : 1));
    try {
      if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
      file = fs.realpathSync(file);
      const relative = path.relative(allowed, file);
      if (relative.startsWith('..') || path.isAbsolute(relative) || !fs.statSync(file).isFile()) return next();
      res.setHeader('Content-Type', types[path.extname(file).toLowerCase()] || 'application/octet-stream');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      if (req.method === 'HEAD') return res.end();
      const stream = fs.createReadStream(file);
      stream.on('error', () => { if (!res.headersSent) res.statusCode = 500; res.end(); });
      stream.pipe(res);
    } catch {
      if (runtimeFile) { res.statusCode = 404; return res.end('Review asset not found'); }
      return next();
    }
  }
  return {name:'workspace-review-files', configureServer(server) { server.middlewares.use(middleware); }, configurePreviewServer(server) { server.middlewares.use(middleware); }};
}
