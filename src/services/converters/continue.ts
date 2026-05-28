import type { Skill } from '../../types/skill'
import type { SkillConverter, ConvertResult } from './base'

export class ContinueConverter implements SkillConverter {
  toolType = 'continue' as const

  convertTo(skill: Skill, isGlobal: boolean): ConvertResult {
    const dir = isGlobal ? '~/.continue/rules' : '.continue/rules'
    const header = `# ${skill.name}\n\n${skill.description}\n\n`
    const content = header + skill.content

    return {
      fileName: `${dir}/${skill.name}.md`,
      content,
      toolType: 'continue'
    }
  }

  convertFrom(content: string, _isGlobal: boolean): Partial<Skill> {
    // Strip the leading heading + description if it matches our output format
    const headingMatch = content.match(/^# (.+?)\n\n(.+?)\n\n([\s\S]*)$/)
    const name = headingMatch ? headingMatch[1] : undefined
    const description = headingMatch ? headingMatch[2] : ''
    const body = headingMatch ? headingMatch[3] : content

    return {
      name,
      description,
      content: body,
      toolType: 'continue' as const,
      format: 'continue.md' as const
    }
  }
}
