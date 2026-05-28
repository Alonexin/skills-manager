import { useState, useMemo } from 'react'
import { useSyncStore } from '../../stores/syncStore'
import { useSkillStore } from '../../stores/skillStore'
import { useSettingsStore } from '../../stores/settingsStore'
import type { ToolType } from '../../types/skill'
import { previewConversion, executeSync } from '../../services/syncEngine'
import { useToastStore } from '../../stores/toastStore'
import { useSyncHistoryStore } from '../../stores/syncHistoryStore'
import { X, ArrowRightLeft, CheckCircle, XCircle, Loader2, FileText, Trash2, Search, Clipboard, Check } from 'lucide-react'
import { toolColors } from '../../constants/tools'

export function SyncPanel() {
  const {
    selectedSourceIds, selectedTargetTools,
    toggleSource, toggleTarget, setShowPreview,
    jobs, addJob, clearJobs, isRunning, setIsRunning,
    syncedMap, markSynced
  } = useSyncStore()
  const { skills } = useSkillStore()
  const { targetTools, syncBehavior } = useSettingsStore()
  const { addToast } = useToastStore()
  const { addRecord } = useSyncHistoryStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [previewSkillId, setPreviewSkillId] = useState<string | null>(null)
  const [previewTool, setPreviewTool] = useState<ToolType | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const filteredSkills = useMemo(() => {
    let list = skills
    // Filter out skills already synced to all selected target tools
    if (selectedTargetTools.length > 0) {
      list = list.filter(s => {
        const syncedTools = syncedMap[s.id]
        if (!syncedTools || syncedTools.length === 0) return true
        return !selectedTargetTools.every(t => syncedTools.includes(t))
      })
    }
    if (!searchQuery.trim()) return list
    const q = searchQuery.toLowerCase()
    return list.filter(s => {
      const name = (s.frontmatter.name || s.name).toLowerCase()
      return name.includes(q) || s.category.toLowerCase().includes(q) || (s.directoryLabel || '').toLowerCase().includes(q)
    })
  }, [skills, searchQuery, selectedTargetTools, syncedMap])

  const isHomeCategory = (cat: string) => cat === 'global' || cat === 'personal'

  const categoryLabel = (cat: string) => {
    switch (cat) {
      case 'global': return '全局'
      case 'personal': return '个人'
      case 'project': return '项目'
      default: return cat
    }
  }

  const selectedSkills = useMemo(
    () => skills.filter(s => selectedSourceIds.includes(s.id)),
    [skills, selectedSourceIds]
  )

  const previewContent = useMemo(() => {
    if (!previewSkillId || !previewTool) return null
    const skill = skills.find(s => s.id === previewSkillId)
    if (!skill) return null
    return previewConversion(skill, previewTool, isHomeCategory(skill.category))
  }, [previewSkillId, previewTool, skills])

  const handleSync = async () => {
    if (selectedSkills.length === 0 || selectedTargetTools.length === 0) return

    setIsRunning(true)
    let successCount = 0
    let failCount = 0
    const linkCommands: string[] = []

    for (const skill of selectedSkills) {
      const isHome = isHomeCategory(skill.category)
      for (const toolType of selectedTargetTools) {
        const toolCfg = targetTools.find(t => t.type === toolType)
        const baseDir = toolCfg
          ? (isHome ? toolCfg.globalDir : toolCfg.projectDir)
          : (isHome ? '~' : '.')
        const job = await executeSync(skill, toolType, baseDir, isHome, syncBehavior)
        addJob(job)
        if (job.status === 'completed') {
          successCount++
          markSynced(skill.id, toolType)
          if (job.linkCommand) linkCommands.push(job.linkCommand)
        } else {
          failCount++
        }
        addRecord({
          skillName: skill.frontmatter.name || skill.name,
          targetTool: toolType,
          targetPath: job.targetPath,
          syncMode: syncBehavior,
          linkCommand: job.linkCommand,
          status: job.status as 'completed' | 'failed',
          error: job.error,
          timestamp: job.timestamp,
        })
      }
    }

    setIsRunning(false)

    if (successCount > 0 || failCount > 0) {
      addToast({
        type: failCount > 0 ? 'error' : 'success',
        title: `同步完成: ${selectedTargetTools.map(t => targetTools.find(c => c.type === t)?.name || t).join(', ')}`,
        message: failCount > 0
          ? `${successCount} 成功, ${failCount} 失败`
          : `已同步 ${successCount} 个 skill`,
        linkCommand: syncBehavior === 'symlink' && linkCommands.length > 0 ? linkCommands[0] : undefined
      })
    }
  }

  const handleSelectAll = () => {
    if (selectedSourceIds.length === skills.length) {
      useSyncStore.getState().setSelectedSourceIds([])
    } else {
      useSyncStore.getState().setSelectedSourceIds(skills.map(s => s.id))
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-[5vh]">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4" />
            Skill 同步
          </h2>
          <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Source skills */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">源 Skills</h3>
              <button onClick={handleSelectAll} className="text-[10px] text-primary-500 hover:text-primary-600">
                {selectedSourceIds.length === skills.length ? '取消全选' : '全选'}
              </button>
            </div>
            {/* Search input */}
            <div className="relative mb-2">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="搜索 skill 名称、分类..."
                className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md divide-y divide-gray-100 dark:divide-gray-800">
              {filteredSkills.length === 0 ? (
                <div className="p-4 text-xs text-gray-400 text-center">
                  {skills.length > 0 && filteredSkills.length === 0 && selectedTargetTools.length > 0
                    ? '所有 skills 已同步至所选目标工具'
                    : searchQuery ? '无匹配结果' : '没有可用的 skills'}
                </div>
              ) : (
                filteredSkills.map(skill => (
                  <label
                    key={skill.id}
                    className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 text-xs ${
                      selectedSourceIds.includes(skill.id) ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSourceIds.includes(skill.id)}
                      onChange={() => toggleSource(skill.id)}
                      className="rounded"
                    />
                    <FileText className="w-3 h-3 text-gray-400 shrink-0" />
                    <span className="truncate">{skill.frontmatter.name || skill.name}</span>
                    <span className="ml-auto text-[10px] text-gray-400">{categoryLabel(skill.category)}</span>
                  </label>
                ))
              )}
            </div>
            {selectedTargetTools.length > 0 && filteredSkills.length < skills.length && (
              <p className="text-[9px] text-gray-400 mt-1">已隐藏 {skills.length - filteredSkills.length} 个已同步 skill</p>
            )}
          </div>

          {/* Target tools - from config */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">目标 AI 工具</h3>
            {targetTools.length === 0 ? (
              <div className="text-xs text-gray-400 py-2">暂无配置，请在设置中添加目标工具</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {targetTools.map(opt => (
                  <button
                    key={opt.type}
                    onClick={() => toggleTarget(opt.type)}
                    className={`px-3 py-1.5 rounded-md text-xs flex items-center gap-1.5 transition-colors border ${
                      selectedTargetTools.includes(opt.type)
                        ? 'bg-primary-500 text-white border-primary-500'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border-transparent'
                    }`}
                  >
                    {opt.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Preview */}
          {previewContent && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">预览</h3>
              <div className="border border-gray-200 dark:border-gray-700 rounded-md p-3 bg-gray-50 dark:bg-gray-900">
                <div className="text-[10px] text-gray-400 mb-1">输出文件: {previewContent.fileName}</div>
                <pre className="text-xs font-mono whitespace-pre-wrap max-h-48 overflow-y-auto text-gray-700 dark:text-gray-300">
                  {previewContent.content.slice(0, 2000)}
                  {previewContent.content.length > 2000 && '\n... (仅显示前 2000 字符)'}
                </pre>
              </div>
            </div>
          )}

          {/* Jobs result */}
          {jobs.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">同步结果</h3>
                <button onClick={clearJobs} className="text-[10px] text-gray-400 hover:text-red-500 flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> 清除
                </button>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {jobs.map(job => (
                  <div key={job.id} className="flex items-center gap-2 text-xs py-1">
                    {job.status === 'completed' ? (
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                    ) : job.status === 'failed' ? (
                      <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    ) : (
                      <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-gray-600 dark:text-gray-400 block truncate">
                        → {job.targetTool}: {job.targetPath || job.id}
                      </span>
                      {job.linkCommand && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <code className="text-[9px] text-cyan-600 dark:text-cyan-400 truncate flex-1">{job.linkCommand}</code>
                          <button
                            onClick={() => handleCopy(job.linkCommand!, job.id)}
                            className="p-0.5 rounded hover:bg-gray-300 dark:hover:bg-gray-600 shrink-0"
                            title="复制命令"
                          >
                            {copiedId === job.id
                              ? <Check className="w-2.5 h-2.5 text-green-500" />
                              : <Clipboard className="w-2.5 h-2.5 text-gray-400" />
                            }
                          </button>
                        </div>
                      )}
                    </div>
                    {job.error && (
                      <span className="text-red-500 text-[10px] truncate">{job.error}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <span className="text-[10px] text-gray-400">
            同步行为: {syncBehavior === 'overwrite' ? '覆盖' : syncBehavior === 'merge' ? '合并' : syncBehavior === 'symlink' ? '软链接' : '询问'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreview(false)}
              className="px-3 py-1.5 text-xs rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              取消
            </button>
            <button
              onClick={handleSync}
              disabled={selectedSkills.length === 0 || selectedTargetTools.length === 0 || isRunning}
              className="px-4 py-1.5 text-xs rounded-md bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {isRunning && <Loader2 className="w-3 h-3 animate-spin" />}
              同步 ({selectedSkills.length} → {selectedTargetTools.length} tools)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
