import type { Skill } from '../../types/skill'
import { FileText, GitBranch, Puzzle, Wrench, FolderCode, Database } from 'lucide-react'
import { toolLabels, toolColors } from '../../constants/tools'

interface Props {
  skill: Skill
  compact?: boolean
}

export function SkillCard({ skill, compact }: Props) {
  const Icon = skill.isRouter ? GitBranch
    : skill.structure.hasSubskills ? Puzzle
    : skill.structure.hasScripts ? Wrench
    : skill.structure.hasConfig ? Database
    : FolderCode

  if (compact) {
    return (
      <div className="flex items-start gap-2">
        <Icon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
          skill.isRouter ? 'text-purple-500' :
          skill.structure.hasSubskills ? 'text-orange-500' :
          'text-gray-400'
        }`} />
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate text-gray-800 dark:text-gray-200">
            {skill.frontmatter.name || skill.name}
          </div>
          {skill.description && (
            <div className="text-[10px] text-gray-400 dark:text-gray-500 truncate mt-0.5">
              {skill.description}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 shrink-0 mt-0.5 text-gray-400" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-sm truncate">
              {skill.frontmatter.name || skill.name}
            </h3>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${toolColors[skill.toolType] || ''}`}>
              {toolLabels[skill.toolType] || skill.toolType}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
            {skill.description}
          </p>
          <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400">
            <span>{skill.stats.lineCount} 行</span>
            <span>{(skill.stats.size / 1024).toFixed(1)} KB</span>
            {skill.structure.hasConfig && <span className="text-primary-500">config</span>}
            {skill.structure.hasScripts && <span className="text-amber-500">scripts</span>}
            {skill.isRouter && <span className="text-purple-500">router</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
