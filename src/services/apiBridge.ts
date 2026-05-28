/**
 * Unified API bridge: abstracts Tauri invoke() vs browser fetch fallback.
 *
 * - In Tauri (desktop app): uses @tauri-apps/api invoke()
 * - In browser (npm run dev): uses /api/* fetch through vite-plugin-file-api.ts
 */

// Lazy-loaded invoke function (dynamic import to avoid bundling in browser)
let _invoke: ((cmd: string, args?: Record<string, unknown>) => Promise<unknown>) | null = null
let _invokeChecked = false

function hasTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window
}

async function getInvoke() {
  if (_invokeChecked) return _invoke
  _invokeChecked = true
  if (hasTauri()) {
    try {
      const mod = await import('@tauri-apps/api/core')
      _invoke = mod.invoke
    } catch {
      _invoke = null
    }
  }
  return _invoke
}

// ---- Browser fallback helpers ----

async function fetchGet(path: string): Promise<any> {
  try {
    const resp = await fetch(`/api/${path}`)
    if (resp.ok) return resp.json()
  } catch { /* ignore */ }
  return null
}

async function fetchText(path: string): Promise<string | null> {
  try {
    const resp = await fetch(`/api/${path}`)
    if (resp.ok) return resp.text()
  } catch { /* ignore */ }
  return null
}

async function fetchPost(path: string, body: Record<string, unknown>): Promise<any> {
  try {
    const resp = await fetch(`/api/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return resp.json()
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

// ---- Public API (exact same signatures as ElectronAPI) ----

export const api = {
  getPlatform(): { platform: string; isNative: boolean } {
    if (hasTauri()) {
      return { platform: navigator.platform || 'win32', isNative: true }
    }
    return { platform: navigator.platform || 'win32', isNative: false }
  },

  async scanDirectory(dirPath: string): Promise<{ name: string; path: string }[]> {
    const inv = await getInvoke()
    if (inv) return (await inv('scan_directory', { dirPath })) as any
    const result = await fetchGet(`scan-dir?path=${encodeURIComponent(dirPath)}`)
    return result ?? []
  },

  async readFile(filePath: string): Promise<string | null> {
    const inv = await getInvoke()
    if (inv) {
      const result = await inv('read_file', { filePath })
      return result as string | null
    }
    return fetchText(`read-file?path=${encodeURIComponent(filePath)}`)
  },

  async writeFile(filePath: string, content: string): Promise<{ success: boolean; error?: string }> {
    const inv = await getInvoke()
    if (inv) return (await inv('write_file', { filePath, content })) as any
    return fetchPost('write-file', { path: filePath, content })
  },

  async fileExists(filePath: string): Promise<boolean> {
    const inv = await getInvoke()
    if (inv) return (await inv('file_exists', { filePath })) as any
    const result = await fetchGet(`file-exists?path=${encodeURIComponent(filePath)}`)
    return result ?? false
  },

  async fileStat(filePath: string): Promise<{ size: number; lastModified: number; isDirectory: boolean } | null> {
    const inv = await getInvoke()
    if (inv) return (await inv('file_stat', { filePath })) as any
    return fetchGet(`file-stat?path=${encodeURIComponent(filePath)}`)
  },

  async listDirectory(dirPath: string): Promise<{ name: string; path: string; isDirectory: boolean }[]> {
    const inv = await getInvoke()
    if (inv) return (await inv('list_directory', { dirPath })) as any
    const result = await fetchGet(`list-dir?path=${encodeURIComponent(dirPath)}`)
    return result ?? []
  },

  async createSymlink(target: string, linkPath: string): Promise<{ success: boolean; error?: string }> {
    const inv = await getInvoke()
    if (inv) return (await inv('create_symlink', { target, linkPath })) as any
    return fetchPost('create-symlink', { target, linkPath })
  },

  async fetchUrl(url: string): Promise<{ success: boolean; data?: string; contentType?: string; error?: string }> {
    const inv = await getInvoke()
    if (inv) return (await inv('fetch_url', { url })) as any
    return fetchPost('fetch-url', { url })
  },
}
