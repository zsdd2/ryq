import { escapeHtml } from './note-content'

const DEFAULT_TEMPLATE_ROWS = ['客户', '电话', '事项', '备注']

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

export function buildTemplateNoteHtml(templateRowsText: string): string {
  const rows = normalizeTemplateRows(templateRowsText)
    .map(
      (row) =>
        `<tr><th scope="row">${escapeHtml(row)}</th><td><br></td></tr>`
    )
    .join('')

  return `<table class="note-template-table"><thead><tr><th>项目</th><th>内容</th></tr></thead><tbody>${rows}</tbody></table>`
}
