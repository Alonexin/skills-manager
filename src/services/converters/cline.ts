import type { Skill } from '../../types/skill'
import type { SkillConverter, ConvertResult } from './base'
import { serializeFrontmatter, parseFrontmatter } from '../../utils/frontmatter'

export class ClineConverter implements SkillConverter {
  toolType = 'cline' as const

  convertTo(skill: Skill, isGlobal: boolean): ConvertResult {
    const dir = isGlobal ? '~/Documents/Cline/Rules' : '.clinerules'
    const frontmatter: Record<string, any> = {
      description: skill.description || skill.name
    }

    if (skill.frontmatter.tags) {
      frontmatter.globs = skill.frontmatter.tags
    }

    const content = serializeFrontmatter(frontmatter, skill.content)

    return {
      fileName: `${dir}/${skill.name}.md`,
      content,
      toolType: 'cline'
    }
  }

  convertFrom(content: string, _isGlobal: boolean): Partial<Skill> {
    const { frontmatter, content: body } = parseFrontmatter(content)
    return {
      description: frontmatter.description || '',
      content: body,
      frontmatter: { ...frontmatter, tags: frontmatter.globs || frontmatter.tags },
      toolType: 'cline' as const,
      format: 'clinerules.md' as const
    }
  }
}
