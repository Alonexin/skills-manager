import type { Skill, SyncJob, ToolType } from '../types/skill'
import type { SkillConverter, ConvertResult } from './converters/base'
import { api } from './apiBridge'
import { CursorConverter } from './converters/cursor'
import { CopilotConverter } from './converters/copilot'
import { ClineConverter } from './converters/cline'
import { WindsurfConverter } from './converters/windsurf'
import { ContinueConverter } from './converters/continue'
import { TraeConverter } from './converters/trae'

const converters: Partial<Record<ToolType, SkillConverter>> = {
  cursor: new CursorConverter(),
  copilot: new CopilotConverter(),
  cline: new ClineConverter(),
  windsurf: new WindsurfConverter(),
  continue: new ContinueConverter(),
  trae: new TraeConverter()
}

export function getConverter(toolType: ToolType): SkillConverter | null {
  return converters[toolType] || null
}

export function previewConversion(skill: Skill, targetTool: ToolType, isHomeDir: boolean): ConvertResult | null {
  const converter = getConverter(targetTool)
  if (!converter) {
    // Generic fallback: pass through as plain markdown
    return {
      fileName: `${targetTool}-skill.md`,
      content: `# ${skill.name}\n\n${skill.description}\n\n${skill.content}`,
      toolType: targetTool
    }
  }
  return converter.convertTo(skill, isHomeDir)
}

export async function executeSync(
  skill: Skill,
  targetTool: ToolType,
  targetDir: string,
  isHomeDir: boolean,
  syncMode: string = 'overwrite'
): Promise<SyncJob> {
  const job: SyncJob = {
    id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sourceSkillId: skill.id,
    targetTool,
    targetPath: '',
    status: 'running',
    timestamp: Date.now()
  }

  const converter = getConverter(targetTool)
  let result: ConvertResult
  let ext = '.md'

  if (converter) {
    result = converter.convertTo(skill, isHomeDir)
    const m = result.fileName.match(/(\.[^.]+)$/)
    ext = m ? m[1] : '.md'
  } else {
    result = {
      fileName: '',
      content: `# ${skill.name}\n\n${skill.description}\n\n${skill.content}`,
      toolType: targetTool
    }
  }

  const targetDirClean = targetDir.replace(/\\/g, '/').replace(/\/+$/, '')
  const folderName = skill.name
  const folderPath = `${targetDirClean}/${folderName}`
  const targetPath = `${folderPath}/${skill.name}${ext}`

  const isWin = typeof navigator !== 'undefined' && /Win/i.test(navigator.platform)
  const linkCommand = syncMode === 'symlink'
    ? (isWin
        ? `mklink /J "${folderPath}" "${skill.dirPath}"`
        : `ln -s "${skill.dirPath}" "${folderPath}"`)
    : undefined

  try {
    if (syncMode === 'symlink') {
      const symResult = await api.createSymlink(skill.dirPath, folderPath)
      if (!symResult.success) {
        return { ...job, status: 'failed', error: symResult.error, targetPath: folderPath, linkCommand }
      }
    } else {
      const writeResult = await api.writeFile(targetPath, result.content)
      if (!writeResult.success) {
        return { ...job, status: 'failed', error: writeResult.error, targetPath, linkCommand }
      }
    }

    return { ...job, targetPath, status: 'completed', linkCommand }
  } catch (e: any) {
    return { ...job, status: 'failed', error: e.message, linkCommand }
  }
}

export async function batchSync(
  skills: Skill[],
  targetTools: ToolType[],
  baseDir: string,
  isHomeDir: boolean
): Promise<SyncJob[]> {
  const jobs: SyncJob[] = []

  for (const skill of skills) {
    for (const tool of targetTools) {
      const job = await executeSync(skill, tool, baseDir, isHomeDir)
      jobs.push(job)
    }
  }

  return jobs
}
