import { escapeHtml } from './note-content'

export interface NoteTemplateDefinition {
  id: string
  name: string
  description: string
  rows: string[]
  columns: string[]
}

const DEFAULT_TEMPLATE_ROWS = ['客户', '电话', '事项', '备注']
const DEFAULT_TEMPLATE_COLUMNS = ['内容']

export function getDefaultNoteTemplates(): NoteTemplateDefinition[] {
  return [
    {
      id: 'custom-table',
      name: '表格模板',
      description: '自定义行和列，生成一条可填写的表格便签',
      rows: DEFAULT_TEMPLATE_ROWS,
      columns: DEFAULT_TEMPLATE_COLUMNS
    },
    {
      id: 'account-membership',
      name: '账号会员管理',
      description: '记录平台账号、会员到期和续费信息',
      rows: ['平台', '账号', '密码', '绑定邮箱', '会员类型', '会员到期', '续费金额', '备注'],
      columns: ['内容']
    }
  ]
}

export function normalizeTemplateRows(value: string): string[] {
  const rows = value
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((row) => row.trim())
    .filter(Boolean)

  return rows.length > 0 ? rows : DEFAULT_TEMPLATE_ROWS
}

export function appendTemplateRow(value: string): string {
  const separator = value.trim().length === 0 || value.endsWith('\n') ? '' : '\n'
  return `${value}${separator}新字段`
}

export function normalizeTemplateColumns(value: string): string[] {
  const columns = value
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((column) => column.trim())
    .filter(Boolean)

  return columns.length > 0 ? columns : DEFAULT_TEMPLATE_COLUMNS
}

export function appendTemplateColumn(value: string): string {
  const separator = value.trim().length === 0 || value.endsWith('\n') ? '' : '\n'
  return `${value}${separator}新列`
}

export function buildTemplateNoteHtml(templateRowsText: string, templateColumnsText = DEFAULT_TEMPLATE_COLUMNS[0]): string {
  const columns = normalizeTemplateColumns(templateColumnsText)
  const headerCells = columns.map((column) => `<th>${escapeHtml(column)}</th>`).join('')
  const rows = normalizeTemplateRows(templateRowsText)
    .map((row) => {
      const valueCells = columns.map(() => '<td><br></td>').join('')
      return `<tr><th scope="row">${escapeHtml(row)}</th>${valueCells}</tr>`
    })
    .join('')

  return `<table class="note-template-table"><thead><tr><th>项目</th>${headerCells}</tr></thead><tbody>${rows}</tbody></table>`
}

export function buildAccountMembershipTemplateHtml(quantity: number, customRows: string[] = []): string {
  const count = Math.max(1, Math.min(20, Math.floor(quantity)))
  const columns = ['账号名称', '账号密码', '账号到期时间', '计时器', ...customRows.map((row) => row.trim()).filter(Boolean)]
  const header = columns.map((column) => `<th>${escapeHtml(column)}</th>`).join('')
  const body = Array.from({ length: count }, (_, index) => {
    const cells = columns.map(() => '<td><br></td>').join('')
    return `<tr class="account-template-row"><th scope="row">账号 ${index + 1}</th>${cells}</tr>`
  }).join('')

  return `<table class="note-template-table account-template-table"><thead><tr><th>序号</th>${header}</tr></thead><tbody>${body}</tbody></table>`
}
