// Minimal static file server for dist/ on 127.0.0.1:8794. Node built-ins only.
// Tailscale proxies https://black-box.<tailnet>.ts.net/ to this port.
import { createServer } from 'node:http'
import { createReadStream, statSync } from 'node:fs'
import { join, normalize, extname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(fileURLToPath(new URL('../dist/', import.meta.url)))
const PORT = Number(process.env.PORT ?? 8794)
const HOST = process.env.HOST ?? '127.0.0.1'
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.ics': 'text/calendar; charset=utf-8',
  '.woff2': 'font/woff2',
  '.m4a': 'audio/mp4',
  '.mp3': 'audio/mpeg',
  '.md': 'text/markdown; charset=utf-8',
  '.map': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
}

function fileFor(urlPath) {
  const clean = normalize(decodeURIComponent(urlPath.split('?')[0])).replace(/^(\.\.[/\\])+/, '')
  let p = join(ROOT, clean)
  if (!p.startsWith(ROOT)) return null
  try {
    if (statSync(p).isDirectory()) p = join(p, 'index.html')
    statSync(p)
    return p
  } catch {
    return join(ROOT, 'index.html') // SPA fallback
  }
}

createServer((req, res) => {
  const p = fileFor(req.url ?? '/')
  if (!p) { res.writeHead(403); res.end(); return }
  const ext = extname(p)
  const hashed = /-[A-Za-z0-9_-]{8,}\.(js|css)$/.test(p)
  res.writeHead(200, {
    'content-type': MIME[ext] ?? 'application/octet-stream',
    'cache-control': hashed ? 'public, max-age=31536000, immutable' : 'no-cache',
  })
  createReadStream(p).pipe(res)
}).listen(PORT, HOST, () => console.log(`coffee-button serving ${ROOT} on http://${HOST}:${PORT}`))
