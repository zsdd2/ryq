import { escapeHtml } from './note-content'

const DEFAULT_TEMPLATE_ROWS = ['客户', '电话', '事项', '备注']
const DEFAULT_TEMPLATE_COLUMNS = ['内容']

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
