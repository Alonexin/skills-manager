import type { Skill } from '../../types/skill'
import { X, Tag, Info } from 'lucide-react'

interface Props {
  skill: Skill
}

export function FrontmatterPanel({ skill }: Props) {
  const entries = Object.entries(skill.frontmatter).filter(
    ([key]) => key !== 'name' && key !== 'description'
  )

  if (entries.length === 0) return null

  return (
    <div className="w-64 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 overflow-y-auto shrink-0 p-4">
      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <Info className="w-3.5 h-3.5" /> 元数据
      </h3>

      <div className="space-y-3">
        {entries.map(([key, value]) => (
          <div key={key}>
            <label className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              {key}
            </label>
            <div className="mt-0.5 text-xs text-gray-700 dark:text-gray-300 break-all">
              {renderValue(key, value, skill)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function renderValue(key: string, value: any, skill: Skill): React.ReactNode {
  if (key === 'tags' && Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {value.map((tag: string, i: number) => (
          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
            {tag}
          </span>
        ))}
      </div>
    )
  }

  if (key === 'auto-run-script' && typeof value === 'object') {
    return (
      <code className="text-[10px] bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded block whitespace-pre-wrap">
        {JSON.stringify(value, null, 2)}
      </code>
    )
  }

  if (key === 'parameters' && typeof value === 'object') {
    return (
      <div className="space-y-1 mt-1">
        {Object.entries(value).map(([k, v]) => (
          <div key={k} className="text-[10px]">
            <span className="text-gray-500">{k}:</span>{' '}
            <code className="text-primary-600 dark:text-primary-400">{String(v)}</code>
          </div>
        ))}
      </div>
    )
  }

  if (Array.isArray(value)) {
    return value.join(', ')
  }

  if (typeof value === 'object') {
    return (
      <pre className="text-[10px] bg-gray-200 dark:bg-gray-700 p-1.5 rounded whitespace-pre-wrap break-all">
        {JSON.stringify(value, null, 2)}
      </pre>
    )
  }

  return String(value)
}
