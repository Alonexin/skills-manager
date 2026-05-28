import type { Skill, ToolType } from '../../types/skill'

export interface ConvertResult {
  fileName: string
  content: string
  toolType: ToolType
}

export interface SkillConverter {
  toolType: ToolType
  convertTo(skill: Skill, isGlobal: boolean): ConvertResult
  convertFrom(content: string, isGlobal: boolean): Partial<Skill>
}

export function buildSkill(skill: Skill, toolType: ToolType, content: string, isGlobal: boolean): ConvertResult {
  const ext = getFileExtension(toolType)
  const dir = getTargetDir(toolType, isGlobal)
  return {
    fileName: `${dir}/${skill.name}${ext}`,
    content,
    toolType
  }
}

function getFileExtension(toolType: ToolType): string {
  switch (toolType) {
    case 'cursor': return '.mdc'
    case 'copilot': return '.instructions.md'
    case 'windsurf': return '.md'
    default: return '.md'
  }
}

function getTargetDir(toolType: ToolType, isGlobal: boolean): string {
  switch (toolType) {
    case 'cursor': return isGlobal ? '~/.cursor/rules' : '.cursor/rules'
    case 'copilot': return '.github/instructions'
    case 'cline': return isGlobal ? '~/Documents/Cline/Rules' : '.clinerules'
    case 'windsurf': return '.windsurf/rules'
    case 'continue': return isGlobal ? '~/.continue/rules' : '.continue/rules'
    default: return isGlobal ? '~/.claude/skills' : '.claude/skills'
  }
}
