import type { DownloadConfig, DownloadItem } from '../types/skill'
import { api } from './apiBridge'

export interface RemoteFile {
  name: string
  path: string
  downloadUrl: string
}

function generateId(): string {
  return `dl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function extractFileName(url: string): string {
  try {
    const pathname = new URL(url).pathname
    const name = pathname.split('/').pop() || 'skill.md'
    return name.endsWith('.md') ? name : `${name}.md`
  } catch {
    return 'skill.md'
  }
}

export async function fetchUrlContent(url: string): Promise<{ fileName: string; content: string }> {
  const result = await api.fetchUrl(url)
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch URL')
  }
  return {
    fileName: extractFileName(url),
    content: result.data!
  }
}

export async function fetchGitHubFiles(
  repo: string,
  branch: string,
  dirPath: string,
  onProgress?: (found: number) => void
): Promise<RemoteFile[]> {
  let ref = branch
  if (!ref) {
    const repoResult = await api.fetchUrl(`https://api.github.com/repos/${repo}`)
    if (!repoResult.success) {
      throw new Error(`仓库不存在或无法访问: ${repoResult.error}`)
    }
    const repoData = JSON.parse(repoResult.data!)
    ref = repoData.default_branch
  }

  // Get tree SHA from the branch commit
  const commitResult = await api.fetchUrl(`https://api.github.com/repos/${repo}/commits/${ref}`)
  if (!commitResult.success) {
    throw new Error(`无法获取分支 ${ref}: ${commitResult.error}`)
  }
  const commitData = JSON.parse(commitResult.data!)
  const treeSha = commitData.commit.tree.sha

  // Fetch entire file tree in ONE request
  const treeResult = await api.fetchUrl(`https://api.github.com/repos/${repo}/git/trees/${treeSha}?recursive=1`)
  if (!treeResult.success) {
    throw new Error(`无法获取文件树: ${treeResult.error}`)
  }
  const treeData = JSON.parse(treeResult.data!)

  // Filter .md files, optionally under a subdirectory
  const prefix = dirPath.replace(/^\/+/, '').replace(/\/+$/, '')
  const results: RemoteFile[] = []
  for (const item of treeData.tree) {
    if (item.type !== 'blob') continue
    if (!item.path.endsWith('.md')) continue
    if (prefix && !item.path.startsWith(prefix)) continue
    const name = item.path.split('/').pop() || item.path
    results.push({
      name,
      path: item.path,
      downloadUrl: `https://raw.githubusercontent.com/${repo}/${ref}/${item.path}`
    })
    onProgress?.(results.length)
  }
  return results
}

export async function fetchGistFiles(gistId: string): Promise<RemoteFile[]> {
  const id = gistId.includes('/') ? gistId.split('/').pop()! : gistId

  const result = await api.fetchUrl(`https://api.github.com/gists/${id}`)
  if (!result.success) {
    throw new Error(`Gist API error: ${result.error}`)
  }
  const data = JSON.parse(result.data!)
  return Object.entries(data.files || {}).map(([name, file]: [string, any]) => ({
    name,
    path: name,
    downloadUrl: file.raw_url
  }))
}

interface ParsedGitHubUrl {
  owner: string
  repo: string
  branch: string
  path: string
  type: 'tree' | 'blob'
}

function parseGitHubUrl(url: string): ParsedGitHubUrl | null {
  try {
    const parsed = new URL(url)
    if (parsed.hostname !== 'github.com') return null

    const parts = parsed.pathname.split('/').filter(Boolean)
    if (parts.length < 2) return null

    const owner = parts[0]
    const repo = parts[1]

    if (parts.length === 2) {
      return { owner, repo, branch: '', path: '', type: 'tree' }
    }

    if (parts.length >= 4 && (parts[2] === 'tree' || parts[2] === 'blob')) {
      return {
        owner,
        repo,
        branch: parts[3],
        path: parts.slice(4).join('/'),
        type: parts[2] as 'tree' | 'blob'
      }
    }

    return null
  } catch {
    return null
  }
}

export async function discoverFiles(
  config: DownloadConfig,
  onProgress?: (found: number) => void
): Promise<RemoteFile[]> {
  switch (config.sourceType) {
    case 'url': {
      const urls = config.urls.filter(u => u.trim())
      if (urls.length === 0) return []

      const results: RemoteFile[] = []
      for (const url of urls) {
        const gh = parseGitHubUrl(url.trim())
        if (gh && gh.type === 'tree') {
          const files = await fetchGitHubFiles(
            `${gh.owner}/${gh.repo}`,
            gh.branch,
            gh.path,
            onProgress
          )
          results.push(...files)
        } else if (gh && gh.type === 'blob') {
          const rawUrl = `https://raw.githubusercontent.com/${gh.owner}/${gh.repo}/${gh.branch}/${gh.path}`
          const name = gh.path.split('/').pop() || 'file.md'
          results.push({ name, path: gh.path, downloadUrl: rawUrl })
        } else {
          const name = extractFileName(url.trim())
          results.push({ name, path: name, downloadUrl: url.trim() })
        }
      }
      return results
    }
    case 'github': {
      if (!config.githubRepo.trim()) throw new Error('请输入 GitHub 仓库 (如 user/repo)')
      return fetchGitHubFiles(
        config.githubRepo.trim(),
        config.githubBranch.trim() || 'main',
        config.githubPath.trim(),
        onProgress
      )
    }
    case 'gist': {
      if (!config.gistId.trim()) throw new Error('请输入 Gist ID')
      return fetchGistFiles(config.gistId.trim())
    }
    default:
      throw new Error('Unknown source type')
  }
}

export async function downloadAndSave(
  config: DownloadConfig,
  items: DownloadItem[],
  onProgress: (id: string, status: DownloadItem['status'], error?: string) => void
): Promise<void> {
  for (const item of items) {
    onProgress(item.id, 'downloading')
    try {
      const { content } = await fetchUrlContent(item.url)

      const targetDir = config.targetDir || getDefaultDir(config.targetCategory)
      const targetDirClean = targetDir.replace(/\\/g, '/').replace(/\/+$/, '')
      const relativePath = item.path || item.fileName
      const filePath = `${targetDirClean}/${relativePath.replace(/^\/+/, '')}`

      const result = await api.writeFile(filePath, content)
      if (!result.success) {
        onProgress(item.id, 'error', result.error)
      } else {
        onProgress(item.id, 'done')
      }
    } catch (e: any) {
      onProgress(item.id, 'error', e.message)
    }
  }
}

function getDefaultDir(category: string): string {
  switch (category) {
    case 'global': return '~/.claude/skills'
    case 'personal': return '~/.claude/skills'
    case 'project': return '.claude/skills'
    default: return '.'
  }
}
