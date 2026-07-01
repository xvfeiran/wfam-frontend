/**
 * 预设「系统回写字段」注册表。
 *
 * 这些字段名由系统保留，在精分析报告填表时有特殊处理
 * （例如值会自动回写到数据库其它表）。模板作者通过占位符生成器
 * 的「系统回写字段」入口查看并一键插入，避免成为潜规则。
 *
 * 新增预设只需往 presetFields 数组追加一项。
 */
export type FieldType = 'text' | 'textarea' | 'select' | 'date' | 'number' | 'photo' | 'photolist'

export interface PresetField {
  /** 占位符中的 fieldName（系统保留名） */
  fieldName: string
  type: FieldType
  /** 填入生成器的中文标签 */
  labelZh: string
  /** 填入生成器的英文标签 */
  labelEn: string
  required: boolean
  /** select 类型的选项 */
  options: string[]
  /** 卡片标题的 i18n key */
  titleKey: string
  /** 卡片说明的 i18n key */
  descKey: string
}

export const presetFields: PresetField[] = [
  {
    fieldName: 'responsibility',
    type: 'select',
    labelZh: '责任判定',
    labelEn: 'Responsibility',
    required: true,
    options: ['B', 'C', 'S', 'O'],
    titleKey: 'settings.pgPresetResponsibilityTitle',
    descKey: 'settings.pgPresetResponsibilityDesc',
  },
]
