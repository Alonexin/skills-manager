import { useState } from 'react'
import type { Skill } from '../../types/skill'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { FrontmatterPanel } from './FrontmatterPanel'
import {
  FileText, GitBranch, Puzzle, Wrench, Database, Eye, Code2,
  Clock, FileCode, FolderOpen, Layers
} from 'lucide-react'

interface Props {
  skill: Skill
}

export function SkillViewer({ skill }: Props) {
  const [showFrontmatter, setShowFrontmatter] = useState(true)
  const [showRaw, setShowRaw] = useState(false)

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (ts: number) => {
    if (!ts) return '-'
    return new Date(ts).toLocaleString('zh-CN')
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-5 h-5 text-primary-500 shrink-0" />
              <h1 className="text-lg font-semibold truncate">
                {skill.frontmatter.name || skill.name}
              </h1>
            </div>
            {skill.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {skill.description}
              </p>
            )}

            {/* Tags / metadata */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                {skill.toolType}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                {skill.category === 'global' ? '全局' : skill.category === 'personal' ? '个人' : '项目'}
              </span>
              {skill.isRouter && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 flex items-center gap-1">
                  <GitBranch className="w-3 h-3" /> Router
                </span>
              )}
              {skill.structure.hasSubskills && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 flex items-center gap-1">
                  <Puzzle className="w-3 h-3" /> Sub-skills ({skill.structure.subskills.length})
                </span>
              )}
              {skill.structure.hasScripts && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 flex items-center gap-1">
                  <Wrench className="w-3 h-3" /> Scripts
                </span>
              )}
              {skill.structure.hasConfig && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 flex items-center gap-1">
                  <Database className="w-3 h-3" /> Config
                </span>
              )}
              {skill.frontmatter.version && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                  v{skill.frontmatter.version}
                </span>
              )}
            </div>
          </div>

          {/* View toggles */}
          <div className="flex items-center gap-1 ml-4 shrink-0">
            <button
              onClick={() => setShowFrontmatter(!showFrontmatter)}
              className={`p-1.5 rounded text-xs flex items-center gap-1 ${
                showFrontmatter ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600' : 'text-gray-400 hover:text-gray-600'
              }`}
              title="元数据"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowRaw(!showRaw)}
              className={`p-1.5 rounded text-xs flex items-center gap-1 ${
                showRaw ? 'bg-gray-200 dark:bg-gray-700 text-gray-700' : 'text-gray-400 hover:text-gray-600'
              }`}
              title="原始内容"
            >
              <Code2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* File info bar */}
        <div className="flex items-center gap-4 mt-3 text-[10px] text-gray-400">
          <span className="flex items-center gap-1">
            <FolderOpen className="w-3 h-3" />
            {skill.sourcePath}
          </span>
          <span className="flex items-center gap-1">
            <FileCode className="w-3 h-3" />
            {formatSize(skill.stats.size)} · {skill.stats.lineCount} 行
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(skill.stats.lastModified)}
          </span>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main markdown content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {showRaw ? (
            <pre className="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-all">
              {skill.rawContent}
            </pre>
          ) : (
            <div className="markdown-body max-w-4xl">
              {/* Router table display */}
              {skill.isRouter && (
                <div className="mb-6 p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-3 text-purple-700 dark:text-purple-300">
                    <GitBranch className="w-4 h-4" /> 路由表
                  </h3>
                  <div className="space-y-1.5">
                    {skill.routerTargets.map((rt, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="text-purple-600 dark:text-purple-400 font-medium min-w-[80px]">
                          {rt.topic}
                        </span>
                        <span className="text-gray-400">→</span>
                        <code className="text-[11px] bg-purple-100 dark:bg-purple-900/40 px-1.5 py-0.5 rounded text-purple-700 dark:text-purple-300">
                          {rt.targetSkill}
                        </code>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Subskills list */}
              {skill.structure.hasSubskills && (
                <div className="mb-6 p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-3 text-orange-700 dark:text-orange-300">
                    <Layers className="w-4 h-4" /> 子 Skills
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {skill.structure.subskills.map((name, i) => (
                      <span key={i} className="text-[11px] px-2 py-1 rounded bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {skill.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Frontmatter panel */}
        {showFrontmatter && (
          <FrontmatterPanel skill={skill} />
        )}
      </div>
    </div>
  )
}
