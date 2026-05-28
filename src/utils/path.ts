const SKILL_FILE_NAMES = ['SKILL.md', 'skill.md', 'README.md']

export function findSkillFile(entries: { name: string; path: string; isDirectory: boolean }[]): string | null {
  for (const entry of entries) {
    if (!entry.isDirectory && SKILL_FILE_NAMES.includes(entry.name)) {
      return entry.path
    }
  }
  return null
}

export function getSkillDirName(filePath: string): string {
  const parts = filePath.replace(/\\/g, '/').split('/')
  // The skill directory name is the parent of the SKILL.md file
  return parts[parts.length - 2] || ''
}

export function getFileName(filePath: string): string {
  const parts = filePath.replace(/\\/g, '/').split('/')
  return parts[parts.length - 1] || ''
}

export function isSubPath(parent: string, child: string): boolean {
  const normalizedParent = parent.replace(/\\/g, '/').toLowerCase()
  const normalizedChild = child.replace(/\\/g, '/').toLowerCase()
  return normalizedChild.startsWith(normalizedParent)
}

export function generateSkillId(dirPath: string, category: string): string {
  const normalized = dirPath.replace(/\\/g, '/').toLowerCase()
  const hash = simpleHash(normalized)
  return `${category}-${hash}`
}

function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return Math.abs(hash).toString(16).slice(0, 8)
}
