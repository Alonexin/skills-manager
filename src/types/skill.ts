export type SkillCategory = string

export interface Skill {
  id: string
  name: string
  description: string
  sourcePath: string
  dirPath: string
  category: SkillCategory
  directoryLabel: string
  toolType: ToolType
  format: SkillFormat
  frontmatter: Record<string, any>
  content: string
  rawContent: string
  stats: SkillStats
  structure: SkillStructure
  isRouter: boolean
  routerTargets: RouterTarget[]
}

export interface SkillStats {
  size: number
  lastModified: number
  lineCount: number
}

export interface SkillStructure {
  hasScripts: boolean
  hasReferences: boolean
  hasConfig: boolean
  hasSubskills: boolean
  hasEnv: boolean
  subskills: string[]
}

export interface RouterTarget {
  topic: string
  targetSkill: string
  targetPath: string
}

export type ToolType = 'claude' | 'cursor' | 'copilot' | 'cline' | 'windsurf' | 'continue' | 'trae'

export type SkillFormat = 'SKILL.md' | 'rules.mdc' | 'instructions.md' | 'clinerules.md' | 'windsurf.md' | 'continue.md' | 'trae.md'

export interface SkillDirectory {
  path: string
  label: string
  category: SkillCategory
  enabled: boolean
}

export interface TargetToolConfig {
  type: ToolType
  name: string
  globalDir: string
  globalSyncedLabel?: string
  projectDir: string
  projectSyncedLabels?: string[]
  syncBehavior?: 'overwrite' | 'merge' | 'symlink'
}

export interface SyncJob {
  id: string
  sourceSkillId: string
  targetTool: ToolType
  targetPath: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  timestamp: number
  error?: string
  linkCommand?: string
}

export interface SyncRecord {
  id: string
  skillName: string
  targetTool: ToolType
  targetPath: string
  syncMode: string
  linkCommand?: string
  status: 'completed' | 'failed'
  error?: string
  timestamp: number
}

export interface AppSettings {
  skillDirectories: SkillDirectory[]
  targetTools: TargetToolConfig[]
  syncBehavior: 'overwrite' | 'merge' | 'ask' | 'symlink'
  theme: 'light' | 'dark' | 'system'
  customCategories: string[]
}

export interface NativeAPI {
  platform: string
  isNative: boolean
  scanDirectory: (dirPath: string) => Promise<{ name: string; path: string }[]>
  readFile: (filePath: string) => Promise<string | null>
  writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>
  fileExists: (filePath: string) => Promise<boolean>
  fileStat: (filePath: string) => Promise<{ size: number; lastModified: number; isDirectory: boolean } | null>
  listDirectory: (dirPath: string) => Promise<{ name: string; path: string; isDirectory: boolean }[]>
  createSymlink: (target: string, linkPath: string) => Promise<{ success: boolean; error?: string }>
  fetchUrl: (url: string) => Promise<{ success: boolean; data?: string; contentType?: string; error?: string }>
}

export type DownloadSource = 'url' | 'github' | 'gist'

export interface DownloadItem {
  id: string
  url: string
  fileName: string
  path: string
  content: string
  status: 'pending' | 'downloading' | 'done' | 'error'
  error?: string
}

export interface DownloadConfig {
  sourceType: DownloadSource
  urls: string[]
  githubRepo: string
  githubBranch: string
  githubPath: string
  gistId: string
  targetCategory: SkillCategory
  targetDir: string
}

declare global {
  interface Window {
    electronAPI?: NativeAPI
    __TAURI__?: any
  }
}
