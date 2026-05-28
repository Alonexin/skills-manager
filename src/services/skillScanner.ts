import type { Skill, SkillDirectory, SkillCategory } from '../types/skill'
import { parseSkill } from './skillParser'
import { api } from './apiBridge'

const scanDirectory = api.scanDirectory

async function scanRecursive(
  dirPath: string,
  category: SkillCategory,
  label: string,
  depth: number = 0
): Promise<Skill[]> {
  const skills: Skill[] = []
  const entries = await scanDirectory(dirPath)

  for (const entry of entries) {
    const skill = await parseSkill(entry.path, category, label)
    if (skill) {
      skills.push(skill)
    } else if (depth < 3) {
      // Not a skill directory itself — recurse into subdirectories
      const nested = await scanRecursive(entry.path, category, label, depth + 1)
      skills.push(...nested)
    }
  }

  return skills
}

export async function scanSkills(directories: SkillDirectory[]): Promise<Skill[]> {
  const skills: Skill[] = []

  for (const dir of directories) {
    if (!dir.enabled) continue
    const found = await scanRecursive(dir.path, dir.category, dir.label)
    skills.push(...found)
  }

  return skills
}

export async function scanSkillDir(dirPath: string, category: SkillCategory, label: string): Promise<Skill[]> {
  const skills: Skill[] = []
  const entries = await scanDirectory(dirPath)

  for (const entry of entries) {
    const skill = await parseSkill(entry.path, category, label)
    if (skill) skills.push(skill)
  }

  return skills
}

export function getDefaultDirectories(): SkillDirectory[] {
  return [
    {
      path: '~/.claude/skills',
      label: 'Claude Code',
      category: 'global',
      enabled: true
    },
    {
      path: '.claude/skills',
      label: '项目 Skills',
      category: 'project',
      enabled: true
    },
    {
      path: '~/.claude/skills',
      label: '个人 Skills',
      category: 'personal',
      enabled: false
    }
  ]
}

/** Auto-detect tool type from directory path */
export function detectToolType(dirPath: string): import('../types/skill').ToolType {
  const p = dirPath.toLowerCase().replace(/\\/g, '/')
  if (p.includes('/.trae/') || p.includes('/trae/')) return 'trae'
  if (p.includes('/.cursor/') || p.includes('/cursor/')) return 'cursor'
  if (p.includes('/.github/') || p.includes('/copilot/')) return 'copilot'
  if (p.includes('/.clinerules') || p.includes('/cline/')) return 'cline'
  if (p.includes('/.windsurf/') || p.includes('/windsurf/')) return 'windsurf'
  if (p.includes('/.continue/') || p.includes('/continue/')) return 'continue'
  return 'claude'
}
