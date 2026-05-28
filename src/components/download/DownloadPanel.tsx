import { useState } from 'react'
import { useDownloadStore } from '../../stores/downloadStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { useSkillStore } from '../../stores/skillStore'
import type { DownloadItem, DownloadSource, SkillCategory } from '../../types/skill'
import { discoverFiles, downloadAndSave } from '../../services/downloadService'
import {
  X, Download, Link, Globe, FileText, CheckCircle, XCircle,
  Loader2, FolderOpen, Search, Trash2
} from 'lucide-react'

const sourceTabs: { key: DownloadSource; label: string; icon: React.ReactNode }[] = [
  { key: 'url', label: 'URL', icon: <Link className="w-3 h-3" /> },
  { key: 'github', label: 'GitHub', icon: <Globe className="w-3 h-3" /> },
  { key: 'gist', label: 'Gist', icon: <FileText className="w-3 h-3" /> },
]

const builtinCategories: { value: SkillCategory; label: string }[] = [
  { value: 'global', label: '全局' },
  { value: 'project', label: '项目' },
  { value: 'personal', label: '个人' },
]

export function DownloadPanel() {
  const {
    config, items, isDownloading, selectedIds,
    setOpen, setConfig, setItems, updateItem, setIsDownloading,
    toggleSelected, selectAll, clearSelection
  } = useDownloadStore()
  const { skillDirectories, customCategories } = useSettingsStore()
  const { refreshSkills } = useSkillStore()

  const [urlsText, setUrlsText] = useState('')
  const [discovering, setDiscovering] = useState(false)
  const [discoverCount, setDiscoverCount] = useState(0)
  const [discoverError, setDiscoverError] = useState('')
  const [saving, setSaving] = useState(false)

  const activeDirs = skillDirectories.filter(d => d.enabled)

  const handleDiscover = async () => {
    setDiscovering(true)
    setDiscoverCount(0)
    setDiscoverError('')
    try {
      // Sync textarea to config for URL mode
      const cfg = { ...config }
      if (config.sourceType === 'url') {
        cfg.urls = urlsText.split('\n').filter(u => u.trim())
        setConfig({ urls: cfg.urls })
      }

      const files = await discoverFiles(cfg, (count) => setDiscoverCount(count))
      if (files.length === 0) {
        setDiscoverError('未找到 .md 文件')
        setItems([])
      } else {
        const now = Date.now()
        const newItems: DownloadItem[] = files.map(f => ({
          id: `dl-${now}-${Math.random().toString(36).slice(2, 8)}`,
          url: f.downloadUrl,
          fileName: f.name,
          path: f.path,
          content: '',
          status: 'pending'
        }))
        setItems(newItems)
      }
    } catch (e: any) {
      setDiscoverError(e.message)
      setItems([])
    } finally {
      setDiscovering(false)
    }
  }

  const handleDownload = async () => {
    const selected = items.filter(i => selectedIds.includes(i.id))
    if (selected.length === 0) return

    setSaving(true)
    const resolvedDir = getTargetPathPreview()
    await downloadAndSave({ ...config, targetDir: resolvedDir }, selected, (id, status, error) => {
      updateItem(id, { status, error })
    })
    setSaving(false)
    refreshSkills()
  }

  const getTargetPathPreview = (): string => {
    if (config.targetDir) return config.targetDir
    const dir = activeDirs.find(d => d.category === config.targetCategory)
    return dir?.path || (config.targetCategory === 'project' ? '.claude/skills' : '~/.claude/skills')
  }

  const statusIcon = (status: DownloadItem['status']) => {
    switch (status) {
      case 'done': return <CheckCircle className="w-3.5 h-3.5 text-green-500" />
      case 'error': return <XCircle className="w-3.5 h-3.5 text-red-500" />
      case 'downloading': return <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />
      default: return <FileText className="w-3.5 h-3.5 text-gray-400" />
    }
  }

  const allDone = items.length > 0 && items.every(i => i.status === 'done' || i.status === 'error')
  const hasItems = items.length > 0

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-[5vh]">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Download className="w-4 h-4" />
            下载 Skill
          </h2>
          <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {/* Source type tabs */}
          <div className="flex bg-gray-100 dark:bg-gray-900 rounded-lg p-0.5">
            {sourceTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => { setConfig({ sourceType: tab.key }); setItems([]); setDiscoverError(''); setUrlsText('') }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs rounded-md transition-colors ${
                  config.sourceType === tab.key
                    ? 'bg-white dark:bg-gray-700 shadow-sm font-medium'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Input area per source type */}
          {config.sourceType === 'url' && (
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 block">输入 URL（每行一个）</label>
              <textarea
                value={urlsText}
                onChange={e => setUrlsText(e.target.value)}
                placeholder="https://raw.githubusercontent.com/user/repo/main/skills/my-skill.md&#10;https://example.com/another-skill.md"
                rows={4}
                className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none"
              />
            </div>
          )}

          {config.sourceType === 'github' && (
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 block">仓库 (user/repo)</label>
                <input
                  type="text"
                  value={config.githubRepo}
                  onChange={e => setConfig({ githubRepo: e.target.value })}
                  placeholder="user/repo"
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 block">分支</label>
                <input
                  type="text"
                  value={config.githubBranch}
                  onChange={e => setConfig({ githubBranch: e.target.value })}
                  placeholder="main"
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 block">目录路径</label>
                <input
                  type="text"
                  value={config.githubPath}
                  onChange={e => setConfig({ githubPath: e.target.value })}
                  placeholder="skills/"
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>
          )}

          {config.sourceType === 'gist' && (
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 block">Gist ID 或 URL</label>
              <input
                type="text"
                value={config.gistId}
                onChange={e => setConfig({ gistId: e.target.value })}
                placeholder="abc123def456 或 https://gist.github.com/user/abc123def456"
                className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          )}

          {/* Target directory */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">目标目录</h3>
            <div className="flex gap-2 flex-wrap items-center">
              <select
                value={config.targetCategory}
                onChange={e => setConfig({ targetCategory: e.target.value as SkillCategory })}
                className="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                {[...builtinCategories, ...customCategories.map(c => ({ value: c, label: c }))].map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <input
                type="text"
                value={config.targetDir}
                onChange={e => setConfig({ targetDir: e.target.value })}
                placeholder={getTargetPathPreview()}
                className="flex-1 min-w-[200px] px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div className="text-[10px] text-gray-400 mt-1">
              实际路径: {getTargetPathPreview()}
            </div>
          </div>

          {/* Discover / Fetch button */}
          <button
            onClick={handleDiscover}
            disabled={discovering}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs bg-primary-500 text-white rounded-md hover:bg-primary-600 disabled:opacity-50 transition-colors"
          >
            {discovering ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> 正在抓取{discoverCount > 0 ? ` (已发现 ${discoverCount} 个)` : '...'}</>
            ) : (
              <><Search className="w-3.5 h-3.5" /> 抓取文件</>
            )}
          </button>

          {discoverError && (
            <div className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{discoverError}</div>
          )}

          {/* File list */}
          {hasItems && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  文件列表 ({items.length})
                </h3>
                <div className="flex gap-2">
                  <button onClick={selectAll} className="text-[10px] text-primary-500 hover:text-primary-600">全选</button>
                  <button onClick={clearSelection} className="text-[10px] text-gray-400 hover:text-gray-600">取消</button>
                </div>
              </div>
              <div className="space-y-0.5 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md divide-y divide-gray-100 dark:divide-gray-800">
                {items.map(item => (
                  <label
                    key={item.id}
                    className={`flex items-center gap-2 px-3 py-2 text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                      item.status === 'error' ? 'bg-red-50 dark:bg-red-900/10' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => toggleSelected(item.id)}
                      className="rounded shrink-0"
                    />
                    {statusIcon(item.status)}
                    <span className="flex-1 truncate">{item.path || item.fileName}</span>
                    {item.error && (
                      <span className="text-[10px] text-red-500 truncate max-w-[120px]">{item.error}</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 shrink-0">
          <span className="text-[10px] text-gray-400">
            {allDone ? '下载完成' : `已选 ${selectedIds.length}/${items.length} 个文件`}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOpen(false)}
              className="px-3 py-1.5 text-xs rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              取消
            </button>
            <button
              onClick={handleDownload}
              disabled={selectedIds.length === 0 || saving}
              className="px-4 py-1.5 text-xs rounded-md bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {saving && <Loader2 className="w-3 h-3 animate-spin" />}
              下载选中 ({selectedIds.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
