import { useSkillStore } from '../../stores/skillStore'
import { X, FileText, GitBranch, Puzzle } from 'lucide-react'

export function TabBar() {
  const { skills, openTabs, activeTabId, setActiveTab, closeTab } = useSkillStore()

  if (openTabs.length === 0) return null

  return (
    <div className="flex items-center bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-x-auto shrink-0">
      {openTabs.map(id => {
        const skill = skills.find(s => s.id === id)
        const label = skill?.frontmatter.name || skill?.name || id
        const isActive = id === activeTabId
        return (
          <div
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer border-r border-gray-200 dark:border-gray-700 select-none group shrink-0 max-w-[200px] ${
              isActive
                ? 'bg-white dark:bg-gray-900 text-primary-600 dark:text-primary-400 border-t-2 border-t-primary-500'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700/50 border-t-2 border-t-transparent'
            }`}
          >
            {skill?.isRouter ? (
              <GitBranch className="w-3 h-3 shrink-0 text-purple-500" />
            ) : skill?.structure?.hasSubskills ? (
              <Puzzle className="w-3 h-3 shrink-0 text-orange-500" />
            ) : (
              <FileText className="w-3 h-3 shrink-0 text-gray-400" />
            )}
            <span className="truncate">{label}</span>
            <button
              onClick={(e) => { e.stopPropagation(); closeTab(id) }}
              className="ml-0.5 p-0.5 rounded hover:bg-gray-300 dark:hover:bg-gray-600 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
