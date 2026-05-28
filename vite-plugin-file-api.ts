import type { Plugin, ViteDevServer } from 'vite'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const ALLOWED_BASE_DIRS: string[] = []

function initAllowedDirs() {
  if (ALLOWED_BASE_DIRS.length > 0) return
  const home = process.env.HOME || process.env.USERPROFILE || ''
  const candidates = [
    home,
    process.cwd(),
    path.resolve(home, '.claude'),
    path.resolve(home, '.cursor'),
    path.resolve(home, '.trae'),
    path.resolve(home, '.continue'),
    path.resolve(home, '.windsurf'),
    path.resolve(home, 'Documents', 'Cline'),
  ]
  for (const d of candidates) {
    if (d && !ALLOWED_BASE_DIRS.includes(d)) {
      ALLOWED_BASE_DIRS.push(d.replace(/\\/g, '/'))
    }
  }
  // Allow drive roots for the workspace drives
  const cwd = process.cwd().replace(/\\/g, '/')
  const driveMatch = cwd.match(/^([a-z]):/i)
  if (driveMatch) {
    ALLOWED_BASE_DIRS.push(`${driveMatch[1].toUpperCase()}:/AI`)
    ALLOWED_BASE_DIRS.push(`${driveMatch[1].toUpperCase()}:/`)
  }
}

function resolveHome(p: string): string {
  if (p.startsWith('~')) {
    const home = process.env.HOME || process.env.USERPROFILE || ''
    return path.resolve(home, p.slice(1))
  }
  return path.resolve(p)
}

function isPathSafe(resolved: string): boolean {
  initAllowedDirs()
  const normalized = resolved.replace(/\\/g, '/').toLowerCase()
  for (const base of ALLOWED_BASE_DIRS) {
    const baseLower = base.toLowerCase()
    if (normalized.startsWith(baseLower + '/') || normalized === baseLower) {
      return true
    }
  }
  return false
}

function fileApiMiddleware(server: ViteDevServer) {
  server.middlewares.use('/api', async (req, res, next) => {
    const url = new URL(req.url!, `http://${req.headers.host}`)
    const apiPath = url.pathname.replace('/api', '')

    // CORS — restrict to same-origin in production
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:5173')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
      res.statusCode = 204
      res.end()
      return
    }

    try {
      switch (apiPath) {
        case '/scan-dir': {
          const dirPath = url.searchParams.get('path')
          if (!dirPath) { res.statusCode = 400; res.end(JSON.stringify({ error: 'Missing path' })); return }
          const resolved = resolveHome(dirPath)
          if (!isPathSafe(resolved)) { res.statusCode = 403; res.end(JSON.stringify({ error: 'Access denied' })); return }
          if (!fs.existsSync(resolved)) { res.end('[]'); return }
          const entries = fs.readdirSync(resolved, { withFileTypes: true })
          const result = entries
            .filter(e => e.isDirectory())
            .map(e => ({ name: e.name, path: path.join(resolved, e.name).replace(/\\/g, '/') }))
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(result))
          return
        }

        case '/read-file': {
          const filePath = url.searchParams.get('path')
          if (!filePath) { res.statusCode = 400; res.end(JSON.stringify({ error: 'Missing path' })); return }
          const resolved = resolveHome(filePath)
          if (!isPathSafe(resolved)) { res.statusCode = 403; res.end(JSON.stringify({ error: 'Access denied' })); return }
          if (!fs.existsSync(resolved)) { res.statusCode = 404; res.end(JSON.stringify({ error: 'File not found' })); return }
          const content = fs.readFileSync(resolved, 'utf-8')
          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          res.end(content)
          return
        }

        case '/file-exists': {
          const filePath = url.searchParams.get('path')
          if (!filePath) { res.statusCode = 400; res.end(JSON.stringify({ error: 'Missing path' })); return }
          const resolved = resolveHome(filePath)
          if (!isPathSafe(resolved)) { res.statusCode = 403; res.end(JSON.stringify({ error: 'Access denied' })); return }
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(fs.existsSync(resolved)))
          return
        }

        case '/file-stat': {
          const filePath = url.searchParams.get('path')
          if (!filePath) { res.statusCode = 400; res.end(JSON.stringify({ error: 'Missing path' })); return }
          const resolved = resolveHome(filePath)
          if (!isPathSafe(resolved)) { res.statusCode = 403; res.end(JSON.stringify({ error: 'Access denied' })); return }
          if (!fs.existsSync(resolved)) { res.end('null'); return }
          const stat = fs.statSync(resolved)
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({
            size: stat.size,
            lastModified: stat.mtimeMs,
            isDirectory: stat.isDirectory()
          }))
          return
        }

        case '/list-dir': {
          const dirPath = url.searchParams.get('path')
          if (!dirPath) { res.statusCode = 400; res.end(JSON.stringify({ error: 'Missing path' })); return }
          const resolved = resolveHome(dirPath)
          if (!isPathSafe(resolved)) { res.statusCode = 403; res.end(JSON.stringify({ error: 'Access denied' })); return }
          if (!fs.existsSync(resolved)) { res.end('[]'); return }
          const entries = fs.readdirSync(resolved, { withFileTypes: true })
          const result = entries.map(e => ({
            name: e.name,
            path: path.join(resolved, e.name).replace(/\\/g, '/'),
            isDirectory: e.isDirectory()
          }))
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(result))
          return
        }

        case '/create-symlink': {
          if (req.method !== 'POST') { res.statusCode = 405; res.end(JSON.stringify({ error: 'Method Not Allowed' })); return }
          let body = ''
          req.on('data', chunk => body += chunk)
          req.on('end', () => {
            try {
              const { target, linkPath } = JSON.parse(body)
              if (!target || !linkPath) { res.statusCode = 400; res.end(JSON.stringify({ error: 'Missing target or linkPath' })); return }
              const resolvedTarget = resolveHome(target)
              const resolvedLink = resolveHome(linkPath)
              if (!isPathSafe(resolvedTarget) || !isPathSafe(resolvedLink)) {
                res.statusCode = 403; res.end(JSON.stringify({ error: 'Access denied' })); return
              }
              const linkDir = path.dirname(resolvedLink)
              if (!fs.existsSync(linkDir)) {
                fs.mkdirSync(linkDir, { recursive: true })
              }
              if (fs.existsSync(resolvedLink)) {
                try { fs.rmSync(resolvedLink, { recursive: true, force: true }) } catch {}
              }
              const isDir = fs.statSync(resolvedTarget).isDirectory()
              const linkType = isDir ? (process.platform === 'win32' ? 'junction' : 'dir') : 'file'
              fs.symlinkSync(resolvedTarget, resolvedLink, linkType)
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: true }))
            } catch (e: any) {
              res.statusCode = 500
              res.end(JSON.stringify({ success: false, error: e.message }))
            }
          })
          return
        }

        case '/write-file': {
          if (req.method !== 'POST') { res.statusCode = 405; res.end(JSON.stringify({ error: 'Method Not Allowed' })); return }
          let body = ''
          req.on('data', chunk => body += chunk)
          req.on('end', () => {
            try {
              const { path: filePath, content } = JSON.parse(body)
              if (!filePath) { res.statusCode = 400; res.end(JSON.stringify({ error: 'Missing path' })); return }
              const resolved = resolveHome(filePath)
              if (!isPathSafe(resolved)) { res.statusCode = 403; res.end(JSON.stringify({ success: false, error: `路径访问被拒绝: ${resolved}` })); return }
              const dir = path.dirname(resolved)
              if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true })
              }
              fs.writeFileSync(resolved, content, 'utf-8')
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: true }))
            } catch (e: any) {
              res.statusCode = 500
              res.end(JSON.stringify({ success: false, error: e.message }))
            }
          })
          return
        }

        case '/fetch-url': {
          if (req.method !== 'POST') { res.statusCode = 405; res.end(JSON.stringify({ error: 'Method Not Allowed' })); return }
          let body = ''
          req.on('data', chunk => body += chunk)
          req.on('end', async () => {
            try {
              const { url: fetchUrl } = JSON.parse(body)
              if (!fetchUrl) { res.statusCode = 400; res.end(JSON.stringify({ success: false, error: 'Missing url' })); return }

              // Only allow http/https URLs
              const parsed = new URL(fetchUrl)
              if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
                res.statusCode = 400
                res.end(JSON.stringify({ success: false, error: 'Only http/https URLs are allowed' }))
                return
              }

              const resp = await fetch(fetchUrl, {
                headers: { 'User-Agent': 'skills-manager/1.0' }
              })
              if (!resp.ok) {
                res.statusCode = 502
                res.end(JSON.stringify({ success: false, error: `HTTP ${resp.status}: ${resp.statusText}` }))
                return
              }
              const data = await resp.text()
              const contentType = resp.headers.get('content-type') || 'text/plain'
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: true, data, contentType }))
            } catch (e: any) {
              res.statusCode = 500
              res.end(JSON.stringify({ success: false, error: e.message }))
            }
          })
          return
        }

        default:
          res.statusCode = 404
          res.end(JSON.stringify({ error: 'Unknown API endpoint' }))
          return
      }
    } catch (e: any) {
      res.statusCode = 500
      res.end(JSON.stringify({ error: e.message }))
    }
  })
}

export function fileApiPlugin(): Plugin {
  return {
    name: 'file-api',
    configureServer(server) {
      fileApiMiddleware(server)
    }
  }
}
