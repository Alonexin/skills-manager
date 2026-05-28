import { useEffect } from 'react'
import { Sidebar } from './components/layout/Sidebar'
import { Toolbar } from './components/layout/Toolbar'
import { SkillViewer } from './components/viewer/SkillViewer'
import { TabBar } from './components/layout/TabBar'
import { SearchResults } from './components/search/SearchResults'
import { SyncPanel } from './components/sync/SyncPanel'
import { DownloadPanel } from './components/download/DownloadPanel'
import { ToastContainer } from './components/common/Toast'
import { useSkillStore } from './stores/skillStore'
import { useSettingsStore } from './stores/settingsStore'
import { useSearchStore } from './stores/searchStore'
import { useSyncStore } from './stores/syncStore'
import { useDownloadStore } from './stores/downloadStore'

export default function App() {
  const { refreshSkills, skills, activeTabId, openTabs, loading } = useSkillStore()
  const { setTheme } = useSettingsStore()
  const { isOpen: searchOpen } = useSearchStore()
  const { showPreview } = useSyncStore()
  const { isOpen: downloadOpen } = useDownloadStore()

  // Initialize theme
  useEffect(() => {
    const stored = localStorage.getItem('skills-manager-settings')
    if (stored) {
      try {
        const settings = JSON.parse(stored)
        if (settings.theme) setTheme(settings.theme)
      } catch {}
    } else {
      setTheme('dark')
    }
  }, [])

  // Load skills on mount
  useEffect(() => {
    refreshSkills()
  }, [])

  const activeSkill = skills.find(s => s.id === activeTabId)

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex items-center gap-3 text-gray-500">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                加载中...
              </div>
            </div>
          ) : activeSkill ? (
            <>
              <TabBar />
              <SkillViewer skill={activeSkill} />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <p className="text-sm">选择一个 Skill 查看详情</p>
                <p className="text-xs mt-1">左侧面板浏览或使用 Ctrl+K 搜索</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Search overlay */}
      {searchOpen && <SearchResults />}

      {/* Sync panel */}
      {showPreview && <SyncPanel />}

      {/* Download panel */}
      {downloadOpen && <DownloadPanel />}

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  )
}
