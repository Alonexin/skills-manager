import { useState, useMemo, useCallback, useEffect } from 'react'
import type { Skill } from '../../types/skill'
import { useSkillStore } from '../../stores/skillStore'
import { FileText, FolderOpen, GitBranch, Puzzle, ChevronRight, Layers } from 'lucide-react'

interface Props {
  skills: Skill[]
}

interface TreeNode {
  name: string
  skills: Skill[]
  children: Record<string, TreeNode>
}

export function SkillTree({ skills }: Props) {
  const { activeTabId, openSkill } = useSkillStore()

  const tree = useMemo(() => buildTree(skills), [skills])
  // Collect all node paths grouped by depth
  const { nodesByDepth, maxDepth } = useMemo(() => {
    const byDepth: Record<number, string[]> = {}
    let max = 0

    function walk(node: TreeNode, key: string, depth: number) {
      if (!node.name) {
        // root node — process children only
        for (const [childKey, childNode] of Object.entries(node.children)) {
          walk(childNode, childKey, 0)
        }
        return
      }
      if (!byDepth[depth]) byDepth[depth] = []
      byDepth[depth].push(key)
      if (depth > max) max = depth
      for (const [childKey, childNode] of Object.entries(node.children)) {
        walk(childNode, `${key}/${childKey}`, depth + 1)
      }
    }

    walk(tree, '', -1)
    return { nodesByDepth: byDepth, maxDepth: max }
  }, [tree])

  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [expandLevel, setExpandLevel] = useState<number | null>(null)

  const applyLevel = useCallback((level: number) => {
    const next: Record<string, boolean> = {}

    if (level === -1) {
      // "全部": expand all
      for (let d = 0; d <= maxDepth; d++) {
        for (const key of (nodesByDepth[d] || [])) {
          next[key] = true
        }
      }
    } else if (level === 0) {
      // "0级": collapse all nodes
      for (let d = 0; d <= maxDepth; d++) {
        for (const key of (nodesByDepth[d] || [])) {
          next[key] = false
        }
      }
    } else {
      // "N级": expand up to depth (level-1), collapse deeper
      const maxExpandDepth = level - 1
      for (let d = 0; d <= maxExpandDepth && d <= maxDepth; d++) {
        for (const key of (nodesByDepth[d] || [])) {
          next[key] = true
        }
      }
      for (let d = maxExpandDepth + 1; d <= maxDepth; d++) {
        for (const key of (nodesByDepth[d] || [])) {
          next[key] = false
        }
      }
    }

    setExpanded(next)
  }, [nodesByDepth, maxDepth])

  const handleLevelClick = useCallback((level: number) => {
    if (expandLevel === level) {
      setExpandLevel(null)
      setExpanded({})
    } else {
      setExpandLevel(level)
      applyLevel(level)
    }
  }, [expandLevel, applyLevel])

  // Map skill id → parent node key for auto-expand on external selection
  const skillParentMap = useMemo(() => {
    const map: Record<string, string> = {}
    function walk(node: TreeNode, parentKey: string) {
      for (const skill of node.skills) {
        map[skill.id] = parentKey
      }
      for (const [childKey, childNode] of Object.entries(node.children)) {
        walk(childNode, parentKey ? `${parentKey}/${childKey}` : childKey)
      }
    }
    if (tree.name) {
      walk(tree, tree.name)
    } else {
      for (const [childKey, childNode] of Object.entries(tree.children)) {
        walk(childNode, childKey)
      }
    }
    return map
  }, [tree])

  // Auto-expand parent nodes and scroll when activeTabId changes externally
  useEffect(() => {
    if (!activeTabId) return
    const parentKey = skillParentMap[activeTabId]
    if (!parentKey) return

    // Expand all ancestor nodes along the path
    setExpanded(prev => {
      const next = { ...prev }
      const parts = parentKey.split('/')
      let path = ''
      for (const part of parts) {
        path = path ? `${path}/${part}` : part
        next[path] = true
      }
      return next
    })
    setExpandLevel(null)

    // Scroll the selected skill button into view
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-skill-id="${activeTabId}"]`)
      if (el) {
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    })
  }, [activeTabId, skillParentMap])

  // Re-apply level when tree structure changes (e.g. skills loaded async)
  useEffect(() => {
    if (expandLevel !== null) {
      applyLevel(expandLevel)
    }
  }, [expandLevel, applyLevel])

  const toggleNode = (key: string) => {
    setExpandLevel(null)
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const renderNode = (node: TreeNode, key: string, depth: number, isLast: boolean) => {
    const isExpanded = expanded[key] === true

    return (
      <div key={key} className="relative">
        {node.name && (
          <button
            onClick={() => toggleNode(key)}
            className="w-full flex items-center gap-1 py-0.5 pr-2 text-xs hover:bg-gray-200 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-400"
            style={{ paddingLeft: `${8 + depth * 14}px` }}
          >
            <ChevronRight
              className={`w-3 h-3 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            />
            <FolderOpen className="w-3.5 h-3.5 shrink-0 text-amber-500 dark:text-amber-400" />
            <span className="truncate font-medium">{node.name}</span>
            <span className="ml-auto text-[10px] opacity-50 shrink-0">
              {node.skills.length + countChildren(node)}
            </span>
          </button>
        )}

        {isExpanded && (
          <>
            {/* Child groups */}
            {Object.entries(node.children).map(([childKey, childNode], i, arr) =>
              renderNode(childNode, `${key}/${childKey}`, depth + 1, i === arr.length - 1 && childNode.skills.length === 0)
            )}
            {/* Skills in this node */}
            {node.skills.map((skill, i) => (
              <button
                key={skill.id}
                data-skill-id={skill.id}
                onClick={() => openSkill(skill.id)}
                className={`w-full flex items-center gap-1.5 py-0.5 pr-2 text-xs text-left hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors relative ${
                  activeTabId === skill.id
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
                style={{ paddingLeft: `${8 + (depth + 1) * 14}px` }}
              >
                {/* Guide line from parent */}
                <span
                  className="absolute border-l border-gray-200 dark:border-gray-700"
                  style={{
                    left: `${8 + depth * 14 + 6}px`,
                    top: 0,
                    bottom: i === node.skills.length - 1 ? '50%' : 0
                  }}
                />
                <span
                  className="absolute border-t border-gray-200 dark:border-gray-700 w-2"
                  style={{
                    left: `${8 + depth * 14 + 6}px`,
                    top: '50%'
                  }}
                />
                {skill.isRouter ? (
                  <GitBranch className="w-3.5 h-3.5 shrink-0 text-purple-500" />
                ) : skill.structure.hasSubskills ? (
                  <Puzzle className="w-3.5 h-3.5 shrink-0 text-orange-500" />
                ) : (
                  <FileText className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                )}
                <span className="truncate">{skill.frontmatter.name || skill.name}</span>
              </button>
            ))}
          </>
        )}
      </div>
    )
  }

  return (
    <div className="select-none">
      {/* Level controls */}
      {skills.length > 0 && (
        <div className="flex items-center gap-0.5 px-2 py-1 border-b border-gray-100 dark:border-gray-800">
          <Layers className="w-3 h-3 text-gray-400 shrink-0 mr-1" />
          <span className="text-[10px] text-gray-400 mr-1">层级:</span>
          {[0, 1, 2, 3, -1].map(level => {
            if (level > 0 && level - 1 > maxDepth) return null
            const label = level === -1 ? '全部' : `${level}级`
            const isActive = expandLevel === level
            return (
              <button
                key={level}
                onClick={() => handleLevelClick(level)}
                className={`px-1.5 py-0.5 text-[10px] rounded transition-colors ${
                  isActive
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      )}
      {Object.entries(tree.children).map(([key, node], i, arr) =>
        renderNode(node, key, 0, i === arr.length - 1 && tree.skills.length === 0)
      )}
      {/* Skills at root level (no prefix grouping) */}
      {tree.skills.map((skill, i) => (
        <button
          key={skill.id}
          data-skill-id={skill.id}
          onClick={() => openSkill(skill.id)}
          className={`w-full flex items-center gap-1.5 py-0.5 pr-2 text-xs text-left hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors ${
            activeTabId === skill.id
              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
              : 'text-gray-700 dark:text-gray-300'
          }`}
          style={{ paddingLeft: `${8 + 1 * 14}px` }}
        >
          {skill.isRouter ? (
            <GitBranch className="w-3.5 h-3.5 shrink-0 text-purple-500" />
          ) : skill.structure.hasSubskills ? (
            <Puzzle className="w-3.5 h-3.5 shrink-0 text-orange-500" />
          ) : (
            <FileText className="w-3.5 h-3.5 shrink-0 text-gray-400" />
          )}
          <span className="truncate">{skill.frontmatter.name || skill.name}</span>
        </button>
      ))}
    </div>
  )
}

function buildTree(skills: Skill[]): TreeNode {
  const root: TreeNode = { name: '', skills: [], children: {} }
  const groups: Record<string, Skill[]> = {}

  for (const skill of skills) {
    const name = skill.frontmatter.name || skill.name
    const prefix = extractPrefix(name)
    if (prefix) {
      if (!groups[prefix]) groups[prefix] = []
      groups[prefix].push(skill)
    } else {
      root.skills.push(skill)
    }
  }

  for (const [groupName, groupSkills] of Object.entries(groups)) {
    const node: TreeNode = { name: groupName, skills: [], children: {} }
    const subGroups: Record<string, Skill[]> = {}

    for (const skill of groupSkills) {
      const name = skill.frontmatter.name || skill.name
      const subPrefix = extractSubPrefix(name, groupName)
      if (subPrefix) {
        if (!subGroups[subPrefix]) subGroups[subPrefix] = []
        subGroups[subPrefix].push(skill)
      } else {
        node.skills.push(skill)
      }
    }

    for (const [subName, subSkills] of Object.entries(subGroups)) {
      node.children[subName] = { name: subName, skills: subSkills, children: {} }
    }

    root.children[groupName] = node
  }

  return root
}

function extractPrefix(name: string): string | null {
  const match = name.match(/^([a-z]+-[a-z]+)-/)
  if (match && match[1]) return match[1]
  const match2 = name.match(/^([a-z]+)-/)
  if (match2 && match2[1]) return match2[1]
  return null
}

function extractSubPrefix(name: string, parentPrefix: string): string | null {
  const rest = name.slice(parentPrefix.length + 1)
  const match = rest.match(/^([a-z]+)/)
  if (match && match[1] && match[1] !== rest) return match[1]
  return null
}

function countChildren(node: TreeNode): number {
  let count = 0
  for (const child of Object.values(node.children)) {
    count += child.skills.length + countChildren(child)
  }
  return count
}
