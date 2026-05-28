import { useMemo, useState, useEffect } from 'react'
import { useSkillStore } from '../../stores/skillStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { SkillTree } from '../explorer/SkillTree'
import { SkillList } from '../explorer/SkillList'
import type { Skill, SkillCategory } from '../../types/skill'
import { List, FolderTree, Globe, User, FolderGit2, Tag } from 'lucide-react'

interface ProjectGroup {
  label: string
  skills: Skill[]
}

export function Sidebar() {
  const { skills, viewMode, setViewMode, activeTabId } = useSkillStore()
  const { customCategories } = useSettingsStore()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  // Auto-expand group when a skill is selected externally (e.g. from search)
  useEffect(() => {
    if (!activeTabId) return
    const skill = skills.find(s => s.id === activeTabId)
    if (!skill) return

    const key = skill.category === 'project' ? (skill.directoryLabel || skill.name) : skill.category
    setExpanded(prev => ({ ...prev, [key]: true }))
  }, [activeTabId, skills])

  const { globalSkills, personalSkills, projectGroups, customGroups } = useMemo(() => {
    const glob: Skill[] = []
    const pers: Skill[] = []
    const proj: Skill[] = []
    const custom: Skill[] = []

    for (const skill of skills) {
      if (skill.category === 'global') glob.push(skill)
      else if (skill.category === 'personal') pers.push(skill)
      else if (skill.category === 'project') proj.push(skill)
      else custom.push(skill)
    }

    const groupMap = new Map<string, Skill[]>()
    for (const skill of proj) {
      const key = skill.directoryLabel || skill.name
      if (!groupMap.has(key)) groupMap.set(key, [])
      groupMap.get(key)!.push(skill)
    }
    const groups: ProjectGroup[] = Array.from(groupMap.entries())
      .map(([label, skills]) => ({ label, skills }))
      .sort((a, b) => a.label.localeCompare(b.label))

    // Custom groups: start with registered categories (even empty ones)
    const customGroupMap = new Map<string, Skill[]>()
    for (const cat of customCategories) {
      customGroupMap.set(cat, [])
    }
    // Populate with actual skills
    for (const skill of custom) {
      if (!customGroupMap.has(skill.category)) customGroupMap.set(skill.category, [])
      customGroupMap.get(skill.category)!.push(skill)
    }
    const catOrder = new Map(customCategories.map((c, i) => [c, i]))
    const custGroups: ProjectGroup[] = Array.from(customGroupMap.entries())
      .map(([label, skills]) => ({ label, skills }))
      .sort((a, b) => {
        const ai = catOrder.get(a.label)
        const bi = catOrder.get(b.label)
        if (ai !== undefined && bi !== undefined) return ai - bi
        if (ai !== undefined) return -1
        if (bi !== undefined) return 1
        return a.label.localeCompare(b.label)
      })

    return { globalSkills: glob, personalSkills: pers, projectGroups: groups, customGroups: custGroups }
  }, [skills, customCategories])


  const toggleExpand = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const renderGroup = (
    key: string,
    label: string,
    groupSkills: Skill[],
    icon: React.ReactNode,
    colorClass: string
  ) => (
    <div className="mb-1">
      <button
        onClick={() => toggleExpand(key)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700/50"
      >
        <svg
          className={`w-3 h-3 transition-transform shrink-0 ${expanded[key] ? 'rotate-90' : ''}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span className={colorClass}>{icon}</span>
        {label}
        <span className="ml-auto text-[10px] text-gray-400">{groupSkills.length}</span>
      </button>
      {expanded[key] && (
        viewMode === 'tree'
          ? (
            <div className="ml-3 pl-3 border-l border-gray-200 dark:border-gray-700">
              <SkillTree skills={groupSkills} />
            </div>
          )
          : (
            <div className="ml-3 pl-3 border-l border-gray-200 dark:border-gray-700">
              <SkillList skills={groupSkills} />
            </div>
          )
      )}
    </div>
  )

  return (
    <aside className="w-[280px] border-r border-gray-200 dark:border-gray-700 flex flex-col bg-gray-50 dark:bg-gray-800/50 shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Skills ({skills.length})
        </span>
        <div className="flex bg-gray-200 dark:bg-gray-700 rounded-md p-0.5">
          <button
            onClick={() => setViewMode('tree')}
            className={`p-1 rounded ${viewMode === 'tree' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
            title="树形视图"
          >
            <FolderTree className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1 rounded ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
            title="列表视图"
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Skills navigation */}
      <div className="flex-1 overflow-y-auto">
        {/* 全局 Skills */}
        {renderGroup('global', '全局 Skills', globalSkills,
          <Globe className="w-3.5 h-3.5" />,
          'text-blue-500'
        )}

        {/* 个人 Skills */}
        {renderGroup('personal', '个人 Skills', personalSkills,
          <User className="w-3.5 h-3.5" />,
          'text-purple-500'
        )}

        {/* 自定义分类 Skills */}
        {customGroups.map(group =>
          renderGroup(group.label, group.label, group.skills,
            <Tag className="w-3.5 h-3.5" />,
            'text-orange-500'
          )
        )}

        {/* 项目 Skills - 按项目名分组 */}
        {projectGroups.length > 0 && (
          <div>
            <div className="px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              项目 Skills
            </div>
            {projectGroups.map(group =>
              renderGroup(group.label, group.label, group.skills,
                <FolderGit2 className="w-3.5 h-3.5" />,
                'text-green-500'
              )
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
