import type { Skill } from '../../types/skill'
import type { SkillConverter, ConvertResult } from './base'
import { serializeFrontmatter, parseFrontmatter } from '../../utils/frontmatter'

export class CursorConverter implements SkillConverter {
  toolType = 'cursor' as const

  convertTo(skill: Skill, isGlobal: boolean): ConvertResult {
    const dir = isGlobal ? '~/.cursor/rules' : '.cursor/rules'
    const frontmatter: Record<string, any> = {
      description: skill.description || skill.name
    }

    if (skill.frontmatter.tags) {
      frontmatter.globs = skill.frontmatter.tags.map((t: string) => `**/*.${t}*`)
    }

    const content = serializeFrontmatter(frontmatter, skill.content)

    return {
      fileName: `${dir}/${skill.name}.mdc`,
      content,
      toolType: 'cursor'
    }
  }

  convertFrom(content: string, _isGlobal: boolean): Partial<Skill> {
    const { frontmatter, content: body } = parseFrontmatter(content)
    return {
      description: frontmatter.description || '',
      content: body,
      frontmatter: { ...frontmatter, tags: frontmatter.globs || frontmatter.tags },
      toolType: 'cursor' as const,
      format: 'rules.mdc' as const
    }
  }
}
