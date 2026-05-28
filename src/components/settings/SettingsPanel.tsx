import { useState } from 'react'
import { useSettingsStore } from '../../stores/settingsStore'
import { useSkillStore } from '../../stores/skillStore'
import { useSyncStore } from '../../stores/syncStore'
import { executeSync } from '../../services/syncEngine'
import { useToastStore } from '../../stores/toastStore'
import type { SkillDirectory, TargetToolConfig, ToolType } from '../../types/skill'
import {
  X, Plus, Trash2, FolderOpen, Save, RotateCcw, Globe, User, FolderGit2,
  FolderCog, ArrowRightLeft, Palette, Settings2, Tag, Loader2, Clock
} from 'lucide-react'
import { SyncHistorySection } from './SyncHistorySection'
import { useSyncHistoryStore } from '../../stores/syncHistoryStore'

interface Props {
  onClose: () => void
}

const categoryOptions: { value: SkillDirectory['category']; label: string; icon: React.ReactNode }[] = [
  { value: 'global', label: '全局', icon: <Globe className="w-3 h-3" /> },
  { value: 'project', label: '项目', icon: <FolderGit2 className="w-3 h-3" /> },
  { value: 'personal', label: '个人', icon: <User className="w-3 h-3" /> },
]

type NavSection = 'directories' | 'categories' | 'tools' | 'behavior' | 'theme' | 'history'

const navItems: { key: NavSection; label: string; icon: React.ReactNode }[] = [
  { key: 'categories', label: '分类管理', icon: <Tag className="w-4 h-4" /> },
  { key: 'directories', label: '技能目录', icon: <FolderCog className="w-4 h-4" /> },
  { key: 'tools', label: '同步目标工具', icon: <ArrowRightLeft className="w-4 h-4" /> },
  { key: 'behavior', label: '同步行为', icon: <Settings2 className="w-4 h-4" /> },
  { key: 'theme', label: '主题', icon: <Palette className="w-4 h-4" /> },
  { key: 'history', label: '同步历史', icon: <Clock className="w-4 h-4" /> },
]

export function SettingsPanel({ onClose }: Props) {
  const {
    skillDirectories, targetTools, syncBehavior, theme, customCategories,
    setSkillDirectories, setTargetTools, setSyncBehavior, setTheme, setCustomCategories, resetDirectories
  } = useSettingsStore()
  const { refreshSkills } = useSkillStore()
  const [activeSection, setActiveSection] = useState<NavSection>('directories')

  // --- Skill directories state ---
  const [localDirs, setLocalDirs] = useState<SkillDirectory[]>(() =>
    skillDirectories.map(d => ({ ...d }))
  )
  const [newPath, setNewPath] = useState('')
  const [newLabel, setNewLabel] = useState('')

  // --- Target tools state ---
  const [localTools, setLocalTools] = useState<TargetToolConfig[]>(() =>
    targetTools.map(t => ({ ...t }))
  )

  const handleSave = () => {
    setSkillDirectories(localDirs)
    setTargetTools(localTools)
    refreshSkills()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-[5vh]">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 h-[550px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Settings2 className="w-4 h-4" /> 设置
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body: sidebar nav + content */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Left nav */}
          <nav className="w-40 border-r border-gray-200 dark:border-gray-700 p-2 space-y-0.5 shrink-0 bg-gray-50 dark:bg-gray-800/50">
            {navItems.map(item => (
              <button
                key={item.key}
                onClick={() => setActiveSection(item.key)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs rounded-md text-left transition-colors ${
                  activeSection === item.key
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700/50'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeSection === 'directories' && (
              <DirectoriesSection
                localDirs={localDirs}
                setLocalDirs={setLocalDirs}
                newPath={newPath}
                setNewPath={setNewPath}
                newLabel={newLabel}
                setNewLabel={setNewLabel}
                resetDirectories={resetDirectories}
                customCategories={customCategories}
              />
            )}
            {activeSection === 'categories' && (
              <CategoriesSection
                customCategories={customCategories}
                setCustomCategories={setCustomCategories}
              />
            )}
            {activeSection === 'tools' && (
              <ToolsSection localTools={localTools} setLocalTools={setLocalTools} localDirs={localDirs} />
            )}
            {activeSection === 'behavior' && (
              <BehaviorSection syncBehavior={syncBehavior} setSyncBehavior={setSyncBehavior} />
            )}
            {activeSection === 'theme' && (
              <ThemeSection theme={theme} setTheme={setTheme} />
            )}
            {activeSection === 'history' && (
              <SyncHistorySection />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-4 py-3 border-t border-gray-200 dark:border-gray-700 gap-2 shrink-0">
          <button onClick={onClose}
            className="px-4 py-1.5 text-xs rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600">
            取消
          </button>
          <button onClick={handleSave}
            className="px-4 py-1.5 text-xs rounded-md bg-primary-500 text-white hover:bg-primary-600 flex items-center gap-1.5">
            <Save className="w-3 h-3" /> 保存并刷新
          </button>
        </div>
      </div>
    </div>
  )
}

// ============ Section Components ============

function DirectoriesSection({
  localDirs, setLocalDirs, newPath, setNewPath, newLabel, setNewLabel,
  resetDirectories, customCategories,
}: {
  localDirs: SkillDirectory[]
  setLocalDirs: (dirs: SkillDirectory[]) => void
  newPath: string; setNewPath: (v: string) => void
  newLabel: string; setNewLabel: (v: string) => void
  resetDirectories: () => void
  customCategories: string[]
}) {
  const [newCategory, setNewCategory] = useState<string>('project')

  const allCategories = [...categoryOptions, ...customCategories.map(c => ({ value: c as SkillDirectory['category'], label: c, icon: null as React.ReactNode }))]

  // Duplicate label detection
  const labelCounts = new Map<string, number>()
  for (const d of localDirs) {
    const lbl = d.label.trim()
    if (lbl) labelCounts.set(lbl, (labelCounts.get(lbl) || 0) + 1)
  }
  const duplicateLabels = new Set<string>()
  for (const [lbl, n] of labelCounts) {
    if (n > 1) duplicateLabels.add(lbl)
  }

  const getLabelError = (dir: SkillDirectory): string | null => {
    if (!dir.label.trim()) return '显示名不能为空'
    if (duplicateLabels.has(dir.label.trim())) return '显示名重复'
    return null
  }

  const isNewLabelDuplicate = newLabel.trim() && localDirs.some(d => d.label.trim() === newLabel.trim())

  const handleAddDir = () => {
    if (!newPath.trim() || !newLabel.trim()) return
    if (isNewLabelDuplicate) return
    const dir: SkillDirectory = {
      path: newPath.trim(),
      label: newLabel.trim(),
      category: newCategory,
      enabled: true
    }
    setLocalDirs([...localDirs, dir])
    setNewPath('')
    setNewLabel('')
  }

  const handleRemoveDir = (idx: number) => setLocalDirs(localDirs.filter((_, i) => i !== idx))
  const handleToggleDir = (idx: number) => {
    const updated = [...localDirs]
    updated[idx] = { ...updated[idx], enabled: !updated[idx].enabled }
    setLocalDirs(updated)
  }
  const handleUpdateDir = (idx: number, field: keyof SkillDirectory, value: string | boolean) => {
    const updated = [...localDirs]
    updated[idx] = { ...updated[idx], [field]: value }
    setLocalDirs(updated)
  }
  const handleReset = () => {
    resetDirectories()
    const { skillDirectories: defaults } = useSettingsStore.getState()
    setLocalDirs(defaults.map(d => ({ ...d })))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">技能目录</h3>
        <button onClick={handleReset} className="text-[11px] text-gray-400 hover:text-gray-600 flex items-center gap-1">
          <RotateCcw className="w-3 h-3" /> 恢复默认
        </button>
      </div>

      <div className="space-y-1.5 mb-3">
        {localDirs.length === 0 ? (
          <div className="text-xs text-gray-400 text-center py-6 border border-dashed border-gray-300 dark:border-gray-600 rounded">
            暂无目录，请添加
          </div>
        ) : (
          localDirs.map((dir, i) => {
            const labelErr = getLabelError(dir)
            return (
            <div key={i} className={`flex items-center gap-2 text-xs p-2 rounded border ${labelErr ? 'bg-red-50 dark:bg-red-900/10 border-red-300 dark:border-red-700' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'}`}>
              <input type="checkbox" checked={dir.enabled} onChange={() => handleToggleDir(i)} className="rounded shrink-0" />
              <FolderOpen className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <input
                type="text"
                value={dir.path}
                onChange={e => handleUpdateDir(i, 'path', e.target.value)}
                className="flex-1 px-1.5 py-0.5 text-[11px] font-mono border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <div className="relative w-20">
                <input
                  type="text"
                  value={dir.label}
                  onChange={e => handleUpdateDir(i, 'label', e.target.value)}
                  className={`w-full px-1.5 py-0.5 text-[11px] border rounded bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-primary-500 ${labelErr ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
                />
                {labelErr && (
                  <span className="absolute -bottom-3 left-0 text-[9px] text-red-500 whitespace-nowrap">{labelErr}</span>
                )}
              </div>
              <select
                value={dir.category}
                onChange={e => handleUpdateDir(i, 'category', e.target.value)}
                className="px-1.5 py-0.5 text-[11px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                {allCategories.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <button onClick={() => handleRemoveDir(i)} className="text-gray-400 hover:text-red-500 shrink-0">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )})
        )}
      </div>

      <div className="flex gap-2 flex-wrap items-start">
        <input type="text" value={newPath} onChange={e => setNewPath(e.target.value)}
          placeholder="路径，如 f:/AI/myskills"
          className="flex-1 min-w-[160px] px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-primary-500" />
        <div className="relative w-20">
          <input type="text" value={newLabel} onChange={e => setNewLabel(e.target.value)}
            placeholder="显示名*"
            className={`w-full px-2 py-1.5 text-xs border rounded bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-primary-500 ${isNewLabelDuplicate ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`} />
          {isNewLabelDuplicate && (
            <span className="absolute -bottom-3 left-0 text-[9px] text-red-500 whitespace-nowrap">显示名重复</span>
          )}
        </div>
        <select value={newCategory} onChange={e => setNewCategory(e.target.value)}
          className="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900">
          {allCategories.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <button onClick={handleAddDir} disabled={!newPath.trim() || !newLabel.trim() || !!isNewLabelDuplicate}
          className="px-3 py-1.5 text-xs bg-primary-500 text-white rounded hover:bg-primary-600 disabled:opacity-50 flex items-center gap-1">
          <Plus className="w-3 h-3" /> 添加
        </button>
      </div>
    </div>
  )
}

function CategoriesSection({
  customCategories, setCustomCategories,
}: {
  customCategories: string[]
  setCustomCategories: (categories: string[]) => void
}) {
  const [newName, setNewName] = useState('')

  const builtinCategories = [
    { value: 'global', label: '全局', icon: <Globe className="w-3.5 h-3.5" /> },
    { value: 'project', label: '项目', icon: <FolderGit2 className="w-3.5 h-3.5" /> },
    { value: 'personal', label: '个人', icon: <User className="w-3.5 h-3.5" /> },
  ]

  const handleAdd = () => {
    const name = newName.trim()
    if (!name || customCategories.includes(name)) return
    setCustomCategories([...customCategories, name])
    setNewName('')
  }

  const handleRemove = (name: string) => {
    setCustomCategories(customCategories.filter(c => c !== name))
  }

  const isBuiltin = (name: string) => builtinCategories.some(b => b.value === name)

  return (
    <div>
      <h3 className="text-sm font-semibold mb-3">分类管理</h3>
      <p className="text-xs text-gray-400 mb-4">管理系统中的技能分类，默认分类不可删除</p>

      <div className="space-y-1.5 mb-4">
        {/* Built-in categories (non-deletable) */}
        {builtinCategories.map(cat => (
          <div key={cat.value} className="flex items-center gap-3 text-xs p-2.5 rounded bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <span className="text-gray-500 dark:text-gray-400">{cat.icon}</span>
            <span className="flex-1 font-medium">{cat.label}</span>
            <code className="text-[10px] bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-400">{cat.value}</code>
            <span className="text-[10px] text-gray-400 italic">默认</span>
          </div>
        ))}
        {/* Custom categories (deletable) */}
        {customCategories.map(cat => (
          <div key={cat} className="flex items-center gap-3 text-xs p-2.5 rounded bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <Tag className="w-3.5 h-3.5 text-primary-500" />
            <span className="flex-1 font-medium">{cat}</span>
            <code className="text-[10px] bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-400">{cat}</code>
            <button onClick={() => handleRemove(cat)} className="text-gray-400 hover:text-red-500" title="删除">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {customCategories.length === 0 && (
          <div className="text-xs text-gray-400 text-center py-4 border border-dashed border-gray-300 dark:border-gray-600 rounded">
            暂无自定义分类
          </div>
        )}
      </div>

      {/* Add custom category */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="新分类名称"
          className="flex-1 px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        <button
          onClick={handleAdd}
          disabled={!newName.trim() || customCategories.includes(newName.trim())}
          className="px-3 py-1.5 text-xs bg-primary-500 text-white rounded hover:bg-primary-600 disabled:opacity-50 flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> 添加分类
        </button>
      </div>
    </div>
  )
}

function ToolsSection({
  localTools, setLocalTools, localDirs,
}: {
  localTools: TargetToolConfig[]
  setLocalTools: (tools: TargetToolConfig[]) => void
  localDirs: SkillDirectory[]
}) {
  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [globalDir, setGlobalDir] = useState('')
  const [projectDir, setProjectDir] = useState('')

  const availableLabels = localDirs.filter(d => d.label.trim()).map(d => d.label.trim())

  const handleAdd = () => {
    if (!name.trim() || !type.trim()) return
    setLocalTools([...localTools, {
      type: type.trim() as ToolType,
      name: name.trim(),
      globalDir: globalDir.trim(),
      projectDir: projectDir.trim(),
      projectSyncedLabels: []
    }])
    setName(''); setType(''); setGlobalDir(''); setProjectDir('')
  }

  const handleRemove = (idx: number) => setLocalTools(localTools.filter((_, i) => i !== idx))

  const handleUpdate = (idx: number, field: keyof TargetToolConfig, value: string) => {
    const updated = [...localTools]
    updated[idx] = { ...updated[idx], [field]: value }
    setLocalTools(updated)
  }

  const toggleProjectLabel = (toolIdx: number, label: string) => {
    const updated = [...localTools]
    const tool = updated[toolIdx]
    const current = tool.projectSyncedLabels || []
    const next = current.includes(label)
      ? current.filter(l => l !== label)
      : [...current, label]
    updated[toolIdx] = { ...tool, projectSyncedLabels: next }
    setLocalTools(updated)
  }

  const setGlobalLabel = (toolIdx: number, label: string) => {
    const updated = [...localTools]
    updated[toolIdx] = { ...updated[toolIdx], globalSyncedLabel: label || undefined }
    setLocalTools(updated)
  }

  const [syncingTools, setSyncingTools] = useState<Record<number, boolean>>({})
  const { skills } = useSkillStore()
  const { syncBehavior: globalBehavior } = useSettingsStore()
  const { markSynced } = useSyncStore()
  const { addToast } = useToastStore()
  const { addRecord } = useSyncHistoryStore()

  const handleSync = async (toolIdx: number, tool: TargetToolConfig) => {
    setSyncingTools(prev => ({ ...prev, [toolIdx]: true }))
    let successCount = 0
    let failCount = 0
    const linkCommands: string[] = []
    const errors: string[] = []
    try {
      const sourceLabels = new Set<string>()
      if (tool.globalSyncedLabel) sourceLabels.add(tool.globalSyncedLabel)
      for (const l of (tool.projectSyncedLabels || [])) sourceLabels.add(l)

      const matchingSkills = skills.filter(s => sourceLabels.has(s.directoryLabel))
      const behavior = tool.syncBehavior || globalBehavior

      for (const skill of matchingSkills) {
        const isHome = skill.category === 'global' || skill.category === 'personal'
        const targetDir = isHome ? tool.globalDir : tool.projectDir
        const job = await executeSync(skill, tool.type, targetDir, isHome, behavior)
        if (job.status === 'completed') {
          successCount++
          markSynced(skill.id, tool.type)
          if (job.linkCommand) linkCommands.push(job.linkCommand)
        } else {
          failCount++
          if (job.error) errors.push(`${skill.frontmatter.name || skill.name}: ${job.error}`)
        }
        addRecord({
          skillName: skill.frontmatter.name || skill.name,
          targetTool: tool.type,
          targetPath: job.targetPath,
          syncMode: behavior,
          linkCommand: job.linkCommand,
          status: job.status as 'completed' | 'failed',
          error: job.error,
          timestamp: job.timestamp,
        })
      }
    } finally {
      setSyncingTools(prev => ({ ...prev, [toolIdx]: false }))
      if (successCount > 0 || failCount > 0) {
        const isSymlink = (tool.syncBehavior || globalBehavior) === 'symlink'
        addToast({
          type: failCount > 0 ? 'error' : 'success',
          title: `同步完成: ${tool.name}`,
          message: failCount > 0
            ? `${successCount} 成功, ${failCount} 失败`
            : `已同步 ${successCount} 个 skill`,
          linkCommand: isSymlink && linkCommands.length > 0 ? linkCommands[0] : undefined
        })
        // Show up to 3 individual error toasts
        for (const err of errors.slice(0, 3)) {
          addToast({ type: 'error', title: '同步失败', message: err })
        }
      }
    }
  }

  return (
    <div>
      <h3 className="text-sm font-semibold mb-3">同步目标工具</h3>

      <div className="space-y-3 mb-4">
        {localTools.length === 0 ? (
          <div className="text-xs text-gray-400 text-center py-6 border border-dashed border-gray-300 dark:border-gray-600 rounded">
            暂无目标工具，请在下方添加
          </div>
        ) : (
          localTools.map((tool, i) => (
            <div key={i} className="rounded bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{tool.name}</span>
                  <code className="text-[10px] bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-500">{tool.type}</code>
                  <select
                    value={tool.syncBehavior || ''}
                    onChange={e => handleUpdate(i, 'syncBehavior', e.target.value)}
                    className="text-[10px] px-1.5 py-0.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-primary-500 text-gray-500"
                  >
                    <option value="">默认({globalBehavior === 'overwrite' ? '覆盖' : globalBehavior === 'merge' ? '合并' : globalBehavior === 'symlink' ? '软链接' : '询问'})</option>
                    <option value="overwrite">覆盖</option>
                    <option value="merge">合并</option>
                    <option value="symlink">软链接</option>
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleSync(i, tool)}
                    disabled={syncingTools[i]}
                    className="px-2 py-0.5 text-[10px] rounded bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 transition-colors flex items-center gap-1"
                  >
                    {syncingTools[i] && <Loader2 className="w-3 h-3 animate-spin" />}
                    同步
                  </button>
                  <button
                    onClick={() => handleRemove(i)}
                    title="删除"
                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {/* Body */}
              <div className="p-3 space-y-3">
                {/* 全局目录 */}
                <div className="flex items-start gap-3">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 w-14 shrink-0 pt-1.5">全局目录</span>
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      value={tool.globalDir}
                      onChange={e => handleUpdate(i, 'globalDir', e.target.value)}
                      placeholder="目标路径，如 ~/.cursor/rules"
                      className="w-full px-2 py-1 text-[11px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                    {availableLabels.length > 0 && (
                      <select
                        value={tool.globalSyncedLabel || ''}
                        onChange={e => setGlobalLabel(i, e.target.value)}
                        className="w-full px-2 py-1 text-[10px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      >
                        <option value="">-- 选择同步源 --</option>
                        {availableLabels.map(lbl => (
                          <option key={lbl} value={lbl}>{lbl}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
                {/* 项目目录 */}
                <div className="flex items-start gap-3">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 w-14 shrink-0 pt-1.5">项目目录</span>
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      value={tool.projectDir}
                      onChange={e => handleUpdate(i, 'projectDir', e.target.value)}
                      placeholder="目标路径，如 .cursor/rules"
                      className="w-full px-2 py-1 text-[11px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                    {availableLabels.length === 0 ? (
                      <span className="block text-[10px] text-gray-400 italic">无可用技能目录</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {availableLabels.map(lbl => {
                          const checked = (tool.projectSyncedLabels || []).includes(lbl)
                          return (
                            <label
                              key={lbl}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded cursor-pointer border transition-colors ${
                                checked
                                  ? 'bg-primary-100 dark:bg-primary-900/30 border-primary-400 text-primary-700 dark:text-primary-300'
                                  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-primary-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleProjectLabel(i, lbl)}
                                className="sr-only"
                              />
                              {lbl}
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add tool form */}
      <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded p-3 space-y-2">
        <div className="text-[10px] text-gray-400 mb-1">添加新工具</div>
        <div className="flex gap-2 flex-wrap">
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="名称，如 Cursor"
            className="w-28 px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-primary-500" />
          <input type="text" value={type} onChange={e => setType(e.target.value)}
            placeholder="type，如 cursor"
            className="w-28 px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-primary-500" />
        </div>
        <div className="flex gap-2">
          <input type="text" value={globalDir} onChange={e => setGlobalDir(e.target.value)}
            placeholder="全局目录：~/.cursor/rules"
            className="flex-1 px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-primary-500" />
          <input type="text" value={projectDir} onChange={e => setProjectDir(e.target.value)}
            placeholder="项目目录：.cursor/rules"
            className="flex-1 px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-primary-500" />
        </div>
        <button onClick={handleAdd} disabled={!name.trim() || !type.trim()}
          className="px-3 py-1.5 text-xs bg-primary-500 text-white rounded hover:bg-primary-600 disabled:opacity-50 flex items-center gap-1">
          <Plus className="w-3 h-3" /> 添加
        </button>
      </div>
    </div>
  )
}

function BehaviorSection({
  syncBehavior, setSyncBehavior,
}: {
  syncBehavior: string; setSyncBehavior: (b: 'overwrite' | 'merge' | 'ask' | 'symlink') => void
}) {
  const options: { value: 'overwrite' | 'merge' | 'ask' | 'symlink'; label: string; desc: string }[] = [
    { value: 'symlink', label: '软链接', desc: '创建符号链接指向源文件，修改源文件自动同步。需要管理员/开发者模式权限' },
    { value: 'overwrite', label: '覆盖', desc: '用转换后的内容覆盖目标文件' },
    { value: 'merge', label: '合并', desc: '保留目标已有内容，追加新内容（若支持）' },
    { value: 'ask', label: '询问', desc: '每次同步时弹出确认对话框' },
  ]

  return (
    <div>
      <h3 className="text-sm font-semibold mb-3">同步行为</h3>
      <p className="text-xs text-gray-400 mb-4">当目标文件已存在时的处理方式</p>
      <div className="space-y-2">
        {options.map(opt => (
          <label
            key={opt.value}
            className={`flex items-start gap-3 p-3 rounded border cursor-pointer transition-colors ${
              syncBehavior === opt.value
                ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
            }`}
          >
            <input
              type="radio"
              name="syncBehavior"
              checked={syncBehavior === opt.value}
              onChange={() => setSyncBehavior(opt.value)}
              className="mt-0.5"
            />
            <div>
              <div className="text-xs font-medium">{opt.label}</div>
              <div className="text-[11px] text-gray-400 mt-0.5">{opt.desc}</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}

function ThemeSection({
  theme, setTheme,
}: {
  theme: string; setTheme: (t: 'light' | 'dark' | 'system') => void
}) {
  const options: { value: 'light' | 'dark' | 'system'; label: string; desc: string }[] = [
    { value: 'light', label: '浅色', desc: '始终使用浅色主题' },
    { value: 'dark', label: '深色', desc: '始终使用深色主题' },
    { value: 'system', label: '跟随系统', desc: '根据系统设置自动切换' },
  ]

  return (
    <div>
      <h3 className="text-sm font-semibold mb-3">主题</h3>
      <div className="space-y-2">
        {options.map(opt => (
          <label
            key={opt.value}
            className={`flex items-start gap-3 p-3 rounded border cursor-pointer transition-colors ${
              theme === opt.value
                ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
            }`}
          >
            <input
              type="radio"
              name="theme"
              checked={theme === opt.value}
              onChange={() => setTheme(opt.value)}
              className="mt-0.5"
            />
            <div>
              <div className="text-xs font-medium">{opt.label}</div>
              <div className="text-[11px] text-gray-400 mt-0.5">{opt.desc}</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}
