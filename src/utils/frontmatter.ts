import yaml from 'js-yaml'

export interface ParsedMarkdown {
  frontmatter: Record<string, any>
  content: string
}

export function parseFrontmatter(raw: string): ParsedMarkdown {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) {
    return { frontmatter: {}, content: raw }
  }

  try {
    const frontmatter = yaml.load(match[1]) as Record<string, any>
    return {
      frontmatter: frontmatter || {},
      content: match[2].trim()
    }
  } catch {
    return { frontmatter: {}, content: raw }
  }
}

export function serializeFrontmatter(frontmatter: Record<string, any>, content: string): string {
  const yamlStr = yaml.dump(frontmatter, { lineWidth: -1, quotingType: '"' }).trim()
  return `---\n${yamlStr}\n---\n\n${content}`
}

export function parseRouterTable(content: string): { topic: string; targetSkill: string; targetPath: string }[] {
  const results: { topic: string; targetSkill: string; targetPath: string }[] = []

  // Match markdown table rows: | topic | path |
  const tableRegex = /\|([^|]+)\|([^|]+)\|/g
  let match

  while ((match = tableRegex.exec(content)) !== null) {
    const topic = match[1].trim()
    const pathStr = match[2].trim()

    // Skip header rows
    if (topic === '问题类型' || topic === '---' || topic.includes('---') || topic.includes('Read')) continue
    if (pathStr.includes('---') || pathStr.includes('文件')) continue

    // Extract skill name from path
    const pathMatch = pathStr.match(/skills\/([^/]+)\//)
    const targetSkill = pathMatch ? pathMatch[1] : pathStr

    results.push({
      topic,
      targetSkill,
      targetPath: pathStr.replace(/`/g, '')
    })
  }

  return results
}
