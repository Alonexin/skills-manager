import { useState } from 'react'
import { useSearchStore } from '../../stores/searchStore'
import { useSyncStore } from '../../stores/syncStore'
import { useSkillStore } from '../../stores/skillStore'
import { Search, RefreshCw, ArrowRightLeft, Settings, Download } from 'lucide-react'
import { useDownloadStore } from '../../stores/downloadStore'
import { SettingsPanel } from '../settings/SettingsPanel'

export function Toolbar() {
  const { toggleOpen } = useSearchStore()
  const { setShowPreview } = useSyncStore()
  const { setOpen: setDownloadOpen } = useDownloadStore()
  const { refreshSkills, loading } = useSkillStore()
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div className="h-12 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 gap-2 bg-gray-50 dark:bg-gray-800 shrink-0">
      <h1 className="text-sm font-semibold mr-4">Skills Manager</h1>

      {/* Search trigger */}
      <button
        onClick={toggleOpen}
        className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      >
        <Search className="w-3.5 h-3.5" />
        <span>搜索</span>
        <kbd className="ml-2 text-[10px] px-1 py-0.5 rounded bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400">
          Ctrl+K
        </kbd>
      </button>

      <div className="flex-1" />

      {/* Download button */}
      <button
        onClick={() => setDownloadOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      >
        <Download className="w-3.5 h-3.5" />
        <span>下载</span>
      </button>

      {/* Sync button — opens sync panel for selection */}
      <button
        onClick={() => setShowPreview(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-md bg-primary-500 hover:bg-primary-600 text-white transition-colors"
      >
        <ArrowRightLeft className="w-3.5 h-3.5" />
        <span>同步</span>
      </button>

      {/* Settings button */}
      <button
        onClick={() => setShowSettings(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      >
        <Settings className="w-3.5 h-3.5" />
      </button>

      {/* Refresh button */}
      <button
        onClick={refreshSkills}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
      </button>

      {/* Settings modal */}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  )
}
