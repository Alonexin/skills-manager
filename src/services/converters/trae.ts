import type { Skill } from '../../types/skill'
import type { SkillConverter, ConvertResult } from './base'

export class TraeConverter implements SkillConverter {
  toolType = 'trae' as const

  convertTo(skill: Skill, isGlobal: boolean): ConvertResult {
    const dir = isGlobal ? '~/.trae/rules' : '.trae/rules'
    const tagName = skill.name.replace(/\s+/g, '_').toLowerCase()
    const content = `<${tagName}>\n# ${skill.name}\n\n${skill.description}\n\n${skill.content}\n</${tagName}>`

    return {
      fileName: `${dir}/${skill.name}.md`,
      content,
      toolType: 'trae'
    }
  }

  convertFrom(content: string, _isGlobal: boolean): Partial<Skill> {
    // Extract content from XML wrapping tag if present
    const xmlMatch = content.match(/^<(\w+)>\n?# (.+?)\n\n([\s\S]*?)\n?<\/\1>$/m)
    if (xmlMatch) {
      return {
        name: xmlMatch[2],
        content: xmlMatch[3],
        toolType: 'trae' as const,
        format: 'trae.md' as const
      }
    }

    return {
      content,
      toolType: 'trae' as const,
      format: 'trae.md' as const
    }
  }
}
