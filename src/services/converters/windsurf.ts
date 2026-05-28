import type { Skill } from '../../types/skill'
import type { SkillConverter, ConvertResult } from './base'

export class WindsurfConverter implements SkillConverter {
  toolType = 'windsurf' as const

  convertTo(skill: Skill, _isGlobal: boolean): ConvertResult {
    const tagName = skill.name.replace(/\s+/g, '_').toLowerCase()
    const content = `<${tagName}>\n${skill.content}\n</${tagName}>`

    return {
      fileName: `.windsurf/rules/${skill.name}.md`,
      content,
      toolType: 'windsurf'
    }
  }

  convertFrom(content: string, _isGlobal: boolean): Partial<Skill> {
    // Extract content from XML wrapping tag if present
    const xmlMatch = content.match(/^<(\w+)>\n?([\s\S]*?)\n?<\/\1>$/m)
    const body = xmlMatch ? xmlMatch[2] : content

    return {
      content: body,
      toolType: 'windsurf' as const,
      format: 'windsurf.md' as const
    }
  }
}
