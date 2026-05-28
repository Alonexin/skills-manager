import { useState, useCallback, useEffect, useRef } from 'react'
import { useSyncHistoryStore } from '../../stores/syncHistoryStore'
import { Trash2, Clock, Clipboard, Check, GripVertical } from 'lucide-react'

const modeLabels: Record<string, string> = {
  overwrite: '覆盖',
  merge: '合并',
  symlink: '软链接',
  ask: '询问'
}

const toolNames: Record<string, string> = {
  claude: 'Claude Code',
  cursor: 'Cursor',
  copilot: 'Copilot',
  cline: 'Cline',
  windsurf: 'Windsurf',
  continue: 'Continue',
  trae: 'Trae'
}

type FilterMode = 'all' | 'symlink' | 'failed'

const MIN_COL_WIDTH = 32
const colHeaders = ['时间', 'Skill', '工具', '模式', '状态', '路径 / 命令', '']
const defaultColWidths = [88, 76, 60, 44, 44, 280, 28]

export function SyncHistorySection() {
  const { records, removeRecord, clearRecords } = useSyncHistoryStore()
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterMode>('all')
  const [colWidths, setColWidths] = useState<number[]>(() => {
    // Last column (delete) and path column don't need to grow, others can
    return defaultColWidths
  })
  const [resizing, setResizing] = useState<{ idx: number; startX: number; startWidth: number } | null>(null)
  const tableRef = useRef<HTMLTableElement>(null)

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizing) return
    const delta = e.clientX - resizing.startX
    const newWidth = Math.max(MIN_COL_WIDTH, resizing.startWidth + delta)
    setColWidths(prev => {
      const next = [...prev]
      next[resizing.idx] = newWidth
      return next
    })
  }, [resizing])

  const handleMouseUp = useCallback(() => {
    setResizing(null)
  }, [])

  useEffect(() => {
    if (resizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
  }, [resizing, handleMouseMove, handleMouseUp])

  const filtered = filter === 'all'
    ? records
    : filter === 'symlink'
      ? records.filter(r => r.syncMode === 'symlink')
      : records.filter(r => r.status === 'failed')

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    return d.toLocaleString('zh-CN', {
      month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    })
  }

  const startResize = (idx: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setResizing({ idx, startX: e.clientX, startWidth: colWidths[idx] })
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <h3 className="text-sm font-semibold mb-3 shrink-0">同步历史</h3>

      {/* Actions bar */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-md p-0.5">
          {([
            ['all', '全部'],
            ['symlink', '仅软链接'],
            ['failed', '仅失败']
          ] as [FilterMode, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-2 py-1 text-[10px] rounded ${
                filter === key
                  ? 'bg-white dark:bg-gray-700 shadow-sm font-medium'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {key === 'all' ? label : `${label} (${records.filter(r => key === 'symlink' ? r.syncMode === 'symlink' : r.status === 'failed').length})`}
            </button>
          ))}
        </div>
        {records.length > 0 && (
          <button
            onClick={clearRecords}
            className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-red-500"
          >
            <Trash2 className="w-3 h-3" /> 清空
          </button>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex-1 text-xs text-gray-400 text-center py-8 border border-dashed border-gray-300 dark:border-gray-600 rounded">
          {records.length === 0 ? '暂无同步记录' : '无匹配记录'}
        </div>
      ) : (
        <div className="flex-1 min-h-0 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
          <div className="h-full overflow-y-auto overflow-x-auto">
            <table ref={tableRef} className="text-[11px] table-fixed" style={{ width: colWidths.reduce((a, b) => a + b, 0), minWidth: '100%' }}>
              <thead className="bg-gray-50 dark:bg-gray-800/50 sticky top-0 z-10">
                <tr>
                  {colHeaders.map((h, i) => (
                    <th
                      key={i}
                      className="text-left px-1.5 py-2 text-gray-500 font-medium relative select-none"
                      style={{ width: colWidths[i] }}
                    >
                      <span className="block truncate">{h}</span>
                      {i < colHeaders.length - 1 && (
                        <div
                          className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary-300/50 flex items-center justify-center group"
                          onMouseDown={e => startResize(i, e)}
                        >
                          <GripVertical className="w-2.5 h-2.5 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100" />
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map(r => (
                  <tr
                    key={r.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 ${
                      r.syncMode === 'symlink' ? 'bg-cyan-50 dark:bg-cyan-900/10' : ''
                    }`}
                  >
                    <td className="px-1.5 py-1.5 text-gray-500 whitespace-nowrap overflow-hidden" style={{ width: colWidths[0] }}>
                      <span className="flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{formatTime(r.timestamp)}</span>
                      </span>
                    </td>
                    <td className="px-1.5 py-1.5 text-gray-700 dark:text-gray-300 overflow-hidden" title={r.skillName} style={{ width: colWidths[1] }}>
                      <span className="block truncate">{r.skillName}</span>
                    </td>
                    <td className="px-1.5 py-1.5 text-gray-500 whitespace-nowrap overflow-hidden" title={toolNames[r.targetTool] || r.targetTool} style={{ width: colWidths[2] }}>
                      <span className="block truncate">{toolNames[r.targetTool] || r.targetTool}</span>
                    </td>
                    <td className="px-1.5 py-1.5 whitespace-nowrap" style={{ width: colWidths[3] }}>
                      <span className={`text-[10px] px-1 py-0.5 rounded inline-block ${
                        r.syncMode === 'symlink'
                          ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}>
                        {modeLabels[r.syncMode] || r.syncMode}
                      </span>
                    </td>
                    <td className="px-1.5 py-1.5 whitespace-nowrap" style={{ width: colWidths[4] }}>
                      <span className={`text-[10px] ${
                        r.status === 'completed' ? 'text-green-600' : 'text-red-500'
                      }`}>
                        {r.status === 'completed' ? '完成' : '失败'}
                      </span>
                      {r.error && (
                        <span className="text-[10px] text-red-400 block truncate" title={r.error}>
                          {r.error}
                        </span>
                      )}
                    </td>
                    <td className="px-1.5 py-1.5" style={{ width: colWidths[5] }}>
                      <div className="flex items-center gap-1 min-w-0">
                        <code className="text-[10px] text-gray-500 dark:text-gray-400 truncate min-w-0">
                          {r.linkCommand || r.targetPath}
                        </code>
                        {r.linkCommand && (
                          <button
                            onClick={() => handleCopy(r.linkCommand!, r.id)}
                            className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 shrink-0"
                            title="复制命令"
                          >
                            {copiedId === r.id
                              ? <Check className="w-2.5 h-2.5 text-green-500" />
                              : <Clipboard className="w-2.5 h-2.5 text-gray-400" />
                            }
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-0.5 py-1.5" style={{ width: colWidths[6] }}>
                      <button
                        onClick={() => removeRecord(r.id)}
                        className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        <Trash2 className="w-2.5 h-2.5 text-gray-400 hover:text-red-500" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
