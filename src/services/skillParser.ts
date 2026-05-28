import type { Skill, SkillStats, SkillStructure, RouterTarget, SkillCategory, ToolType, SkillFormat } from '../types/skill'
import { parseFrontmatter, parseRouterTable } from '../utils/frontmatter'
import { getSkillDirName, generateSkillId } from '../utils/path'
import { detectToolType } from './skillScanner'
import { api } from './apiBridge'

export async function parseSkill(
  dirPath: string,
  category: SkillCategory,
  directoryLabel: string
): Promise<Skill | null> {
  const toolType = detectToolType(dirPath)
  const skillFileName = await findSkillFileName(dirPath)
  if (!skillFileName) return null

  const skillFilePath = `${dirPath}/${skillFileName}`.replace(/\\/g, '/')
  const raw = await api.readFile(skillFilePath)
  if (!raw) return null

  const { frontmatter, content } = parseFrontmatter(raw)
  const stat = await api.fileStat(skillFilePath)

  // Detect router type (thin skill with routing table)
  const routerTargets = parseRouterTable(content)
  const isRouter = routerTargets.length > 0

  // Detect structure
  const structure = await detectStructure(dirPath)

  const format = detectFormat(dirPath, toolType)

  const skill: Skill = {
    id: generateSkillId(dirPath, category),
    name: frontmatter.name || getSkillDirName(skillFilePath),
    description: frontmatter.description || '',
    sourcePath: skillFilePath,
    dirPath,
    category,
    directoryLabel,
    toolType,
    format,
    frontmatter,
    content,
    rawContent: raw,
    stats: stat ? {
      size: stat.size,
      lastModified: stat.lastModified,
      lineCount: raw.split('\n').length
    } : { size: 0, lastModified: 0, lineCount: 0 },
    structure,
    isRouter,
    routerTargets
  }

  return skill
}

async function findSkillFileName(dirPath: string): Promise<string | null> {
  const skillFileNames = ['SKILL.md', 'skill.md', 'README.md']
  for (const name of skillFileNames) {
    const fp = `${dirPath}/${name}`.replace(/\\/g, '/')
    if (await api.fileExists(fp)) return name
  }
  return null
}

async function detectStructure(dirPath: string): Promise<SkillStructure> {
  const entries = await api.listDirectory(dirPath)
  const entryNames = entries.map(e => e.name)

  const hasScripts = entryNames.includes('scripts') &&
    entries.find(e => e.name === 'scripts')?.isDirectory === true
  const hasReferences = entryNames.includes('reference') &&
    entries.find(e => e.name === 'reference')?.isDirectory === true
  const hasConfig = entryNames.includes('config.yaml') || entryNames.includes('config.yml')
  const hasSubskills = entryNames.includes('subskills') &&
    entries.find(e => e.name === 'subskills')?.isDirectory === true
  const hasEnv = entryNames.includes('.env') || entryNames.includes('.env.example')

  let subskills: string[] = []
  if (hasSubskills) {
    const subDir = `${dirPath}/subskills`
    const subEntries = await api.listDirectory(subDir)
    subskills = subEntries.filter(e => e.isDirectory).map(e => e.name)
  }

  return { hasScripts, hasReferences, hasConfig, hasSubskills, hasEnv, subskills }
}

function detectFormat(_dirPath: string, toolType: ToolType): SkillFormat {
  switch (toolType) {
    case 'cursor': return 'rules.mdc'
    case 'copilot': return 'instructions.md'
    case 'cline': return 'clinerules.md'
    case 'windsurf': return 'windsurf.md'
    case 'continue': return 'continue.md'
    case 'trae': return 'trae.md'
    default: return 'SKILL.md'
  }
}
