import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname);

const HOST = process.env.HOST || '127.0.0.1';
const PREFERRED_PORT = Number(process.env.PORT) || 5500;
const FALLBACK_PORT = 8080;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
};

const PUBLIC_FILES = new Set([
  'index.html',
  'app.js',
  'supabaseClient.js',
  'favicon.ico',
  'favicon.png',
  'favicon-16x16.png',
  'favicon-32x32.png',
  'apple-touch-icon.png',
  'logo.png',
  'logo.jpg',
  'logo-raw.jpg',
  'logo-black.png',
  'logo-black-transparent.png',
  'logo-full-black.png',
  'logo-full-ivory.png',
  'logo-icon-black.png',
  'logo-icon-ivory.png',
  'logo-ivory.png',
  'logo-transparent.png',
]);

const CSP_HEADER = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob:",
  "connect-src 'self' https://mvdknbfisgrwewljqnxw.supabase.co wss://mvdknbfisgrwewljqnxw.supabase.co",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ');

function setSecurityHeaders(res) {
  res.setHeader('Content-Security-Policy', CSP_HEADER);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
}

function sendText(res, statusCode, message) {
  setSecurityHeaders(res);
  res.writeHead(statusCode, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(message);
}

function isSensitiveRequest(rawPathname, normalizedRel) {
  const lower = (rawPathname + '/' + normalizedRel).toLowerCase();
  if (lower.includes('..') || lower.includes('\\')) return true;
  if (
    normalizedRel.startsWith('.') ||
    normalizedRel.startsWith('supabase/') ||
    normalizedRel.startsWith('src/') ||
    normalizedRel.endsWith('.sql') ||
    normalizedRel.endsWith('.ps1') ||
    normalizedRel.endsWith('.ts') ||
    normalizedRel.endsWith('.md') ||
    normalizedRel === 'package.json' ||
    normalizedRel === 'package-lock.json' ||
    normalizedRel === 'server.mjs' ||
    normalizedRel === 'tsconfig.json' ||
    normalizedRel === 'vite.config.ts'
  ) {
    return true;
  }
  return false;
}

const server = http.createServer(async (req, res) => {
  try {
    const method = (req.method || 'GET').toUpperCase();
    if (method !== 'GET' && method !== 'HEAD') {
      res.setHeader('Allow', 'GET, HEAD');
      return sendText(res, 405, '405 Method Not Allowed');
    }

    const rawUrl = req.url || '/';
    const queryIdx = rawUrl.indexOf('?');
    const rawPathname = queryIdx === -1 ? rawUrl : rawUrl.slice(0, queryIdx);

    if (rawPathname.includes('\0') || rawPathname.toLowerCase().includes('%00')) {
      return sendText(res, 400, '400 Bad Request');
    }

    let decodedPath;
    try {
      decodedPath = decodeURIComponent(rawPathname);
    } catch {
      return sendText(res, 400, '400 Bad Request');
    }

    if (decodedPath === '/healthz') {
      setSecurityHeaders(res);
      const payload = JSON.stringify({ status: 'ok', service: 'phoenix-tech-erp' });
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return method === 'HEAD' ? res.end() : res.end(payload);
    }

    if (decodedPath.includes('..') || decodedPath.includes('\\')) {
      return sendText(res, 403, '403 Forbidden');
    }

    const trimmed = decodedPath.replace(/^\/+/, '');
    const relPath = trimmed === '' ? 'index.html' : trimmed;

    if (isSensitiveRequest(decodedPath, relPath)) {
      return sendText(res, 403, '403 Forbidden');
    }

    if (!PUBLIC_FILES.has(relPath)) {
      return sendText(res, 404, '404 Not Found');
    }

    const resolvedPath = path.resolve(ROOT_DIR, relPath);
    if (!resolvedPath.startsWith(ROOT_DIR + path.sep)) {
      return sendText(res, 403, '403 Forbidden');
    }

    const stat = await fs.stat(resolvedPath);
    if (!stat.isFile()) {
      return sendText(res, 404, '404 Not Found');
    }

    const ext = path.extname(resolvedPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    setSecurityHeaders(res);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stat.size,
    });

    if (method === 'HEAD') {
      return res.end();
    }

    const content = await fs.readFile(resolvedPath);
    return res.end(content);
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      return sendText(res, 404, '404 Not Found');
    }
    console.error('[server error]', err);
    return sendText(res, 500, '500 Internal Server Error');
  }
});

function startServer(portToTry, allowFallback = true) {
  server.once('error', (err) => {
    if (err && err.code === 'EADDRINUSE' && allowFallback && portToTry !== FALLBACK_PORT) {
      console.warn(`Port ${portToTry} busy, falling back to ${FALLBACK_PORT}...`);
      startServer(FALLBACK_PORT, false);
    } else {
      console.error('Failed to start server:', err);
      process.exit(1);
    }
  });

  server.listen(portToTry, HOST, () => {
    const addr = server.address();
    const activePort = typeof addr === 'object' && addr ? addr.port : portToTry;
    console.log(`Phoenix Tech Solutions ERP listening on http://${HOST}:${activePort}/ (http://localhost:${activePort}/)`);
  });
}

process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));

startServer(PREFERRED_PORT);
