import { useMemo, useEffect, useRef, useState, useCallback } from 'react'
import Fuse from 'fuse.js'
import { useSearchStore } from '../../stores/searchStore'
import { useSkillStore } from '../../stores/skillStore'
import { FileText, GitBranch, Puzzle, X, ArrowRight } from 'lucide-react'

export function SearchResults() {
  const { query, setOpen, setQuery, filters } = useSearchStore()
  const { skills, openSkill } = useSkillStore()
  const overlayRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const fuse = useMemo(() => new Fuse(skills, {
    keys: ['name', 'description', 'content', 'frontmatter.tags'],
    threshold: 0.3,
    includeScore: true,
    ignoreLocation: true
  }), [skills])

  const results = useMemo(() => {
    if (!query.trim()) return []
    let filtered = fuse.search(query)

    if (filters.category !== 'all') {
      filtered = filtered.filter(r => r.item.category === filters.category)
    }
    if (filters.toolType !== 'all') {
      filtered = filtered.filter(r => r.item.toolType === filters.toolType)
    }

    return filtered.slice(0, 20)
  }, [query, filters, fuse])

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [query, filters])

  const handleSelect = useCallback((id: string) => {
    openSkill(id)
    setOpen(false)
    setQuery('')
  }, [openSkill, setOpen, setQuery])

  // Close on backdrop click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (e.target === overlayRef.current) {
        setOpen(false)
      }
    }
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [setOpen])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        return
      }
      if (results.length === 0) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % results.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + results.length) % results.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        handleSelect(results[selectedIndex].item.id)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [results, selectedIndex, setOpen, handleSelect])

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.querySelector(`[data-search-index="${selectedIndex}"]`)
      if (selected) {
        selected.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex])

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-[15vh]"
    >
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Search input */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
            <input
              autoFocus
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="输入关键字搜索 skills..."
              className="flex-1 bg-transparent text-sm outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
            />
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-80 overflow-y-auto">
          {query.trim() === '' ? (
            <div className="p-6 text-center text-sm text-gray-400">
              输入关键字开始搜索...
            </div>
          ) : results.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400">
              没有找到匹配的 skill
            </div>
          ) : (
            results.map(({ item: skill, score }, idx) => (
              <button
                key={skill.id}
                data-search-index={idx}
                onClick={() => handleSelect(skill.id)}
                className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0 transition-colors flex items-start gap-3 ${
                  idx === selectedIndex
                    ? 'bg-primary-50 dark:bg-primary-900/20'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
                }`}
              >
                {skill.isRouter ? (
                  <GitBranch className="w-4 h-4 shrink-0 mt-0.5 text-purple-500" />
                ) : skill.structure.hasSubskills ? (
                  <Puzzle className="w-4 h-4 shrink-0 mt-0.5 text-orange-500" />
                ) : (
                  <FileText className="w-4 h-4 shrink-0 mt-0.5 text-gray-400" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                    {highlightMatch(skill.frontmatter.name || skill.name, query)}
                  </div>
                  {skill.description && (
                    <div className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                      {highlightMatch(skill.description, query)}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-gray-400">{skill.category === 'global' ? '全局' : skill.category === 'personal' ? '个人' : '项目'}</span>
                    <span className="text-[10px] text-gray-400">{skill.toolType}</span>
                    {score !== undefined && (
                      <span className="text-[10px] text-gray-400">
                        匹配度: {Math.round((1 - (score || 0)) * 100)}%
                      </span>
                    )}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 shrink-0 mt-0.5 text-gray-300" />
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2 text-[10px] text-gray-400">
          <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-700">↑↓</kbd>
          <span>导航</span>
          <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-700">Enter</kbd>
          <span>选择</span>
          <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-700">Esc</kbd>
          <span>关闭</span>
        </div>
      </div>
    </div>
  )
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!text || !query) return text

  const escaped = escapeRegex(query)
  const regex = new RegExp(`(${escaped})`, 'gi')
  const parts = text.split(regex)

  return parts.map((part, i) => {
    const testRegex = new RegExp(`^(${escaped})$`, 'gi')
    return testRegex.test(part)
      ? <mark key={i} className="search-highlight">{part}</mark>
      : <span key={i}>{part}</span>
  })
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
