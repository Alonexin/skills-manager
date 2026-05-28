import type { Skill } from '../../types/skill'
import type { SkillConverter, ConvertResult } from './base'
import { parseFrontmatter } from '../../utils/frontmatter'

export class CopilotConverter implements SkillConverter {
  toolType = 'copilot' as const

  convertTo(skill: Skill, _isGlobal: boolean): ConvertResult {
    const frontmatter = `---\ndescription: "${skill.description || skill.name}"\n---\n\n`
    const content = frontmatter + skill.content

    return {
      fileName: `.github/instructions/${skill.name}.instructions.md`,
      content,
      toolType: 'copilot'
    }
  }

  convertFrom(content: string, _isGlobal: boolean): Partial<Skill> {
    const { frontmatter, content: body } = parseFrontmatter(content)
    return {
      description: frontmatter.description || '',
      content: body,
      frontmatter,
      toolType: 'copilot' as const,
      format: 'instructions.md' as const
    }
  }
}
