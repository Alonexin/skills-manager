import { useEffect } from 'react'
import type { Skill } from '../../types/skill'
import { useSkillStore } from '../../stores/skillStore'
import { SkillCard } from './SkillCard'

interface Props {
  skills: Skill[]
}

export function SkillList({ skills }: Props) {
  const { activeTabId, openSkill } = useSkillStore()

  // Scroll selected skill into view
  useEffect(() => {
    if (!activeTabId) return
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-skill-id="${activeTabId}"]`)
      if (el) {
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    })
  }, [activeTabId])

  return (
    <div className="py-1">
      {skills.map(skill => (
        <button
          key={skill.id}
          data-skill-id={skill.id}
          onClick={() => openSkill(skill.id)}
          className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0 ${
            activeTabId === skill.id
              ? 'bg-primary-100 dark:bg-primary-900/30'
              : ''
          }`}
        >
          <SkillCard skill={skill} compact />
        </button>
      ))}
    </div>
  )
}
