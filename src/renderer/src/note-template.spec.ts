import { describe, expect, it } from 'vitest'
import {
  appendTemplateColumn,
  appendTemplateRow,
  buildTemplateNoteHtml,
  getDefaultNoteTemplates,
  normalizeTemplateColumns,
  normalizeTemplateRows
} from './note-template'

describe('note template helpers', () => {
  it('normalizes template rows from one label per line', () => {
    expect(normalizeTemplateRows('  客户\r\n电话\n\n备注  ')).toEqual(['客户', '电话', '备注'])
  })

  it('uses practical default rows when the template is blank', () => {
    expect(normalizeTemplateRows('   ')).toEqual(['客户', '电话', '事项', '备注'])
  })

  it('appends a new row label for the template builder', () => {
    expect(appendTemplateRow('客户\n电话')).toBe('客户\n电话\n新字段')
  })

  it('turns one reusable template into one editable table note', () => {
    expect(buildTemplateNoteHtml('客户\n电话')).toBe(
      '<table class="note-template-table"><thead><tr><th>项目</th><th>内容</th></tr></thead><tbody><tr><th scope="row">客户</th><td><br></td></tr><tr><th scope="row">电话</th><td><br></td></tr></tbody></table>'
    )
  })

  it('supports adding table columns to a generated template note', () => {
    expect(normalizeTemplateColumns('内容\n结果')).toEqual(['内容', '结果'])
    expect(appendTemplateColumn('内容')).toBe('内容\n新列')
    expect(buildTemplateNoteHtml('客户', '内容\n结果')).toBe(
      '<table class="note-template-table"><thead><tr><th>项目</th><th>内容</th><th>结果</th></tr></thead><tbody><tr><th scope="row">客户</th><td><br></td><td><br></td></tr></tbody></table>'
    )
  })

  it('escapes template row labels before creating table html', () => {
    expect(buildTemplateNoteHtml('金额<100>')).toContain('金额&lt;100&gt;')
  })

  it('provides an account membership template as a reusable template option', () => {
    const templates = getDefaultNoteTemplates()
    const accountTemplate = templates.find((template) => template.id === 'account-membership')

    expect(accountTemplate).toBeDefined()
    expect(accountTemplate?.rows).toContain('平台')
    expect(accountTemplate?.rows).toContain('会员到期')
    expect(buildTemplateNoteHtml(accountTemplate!.rows.join('\n'), accountTemplate!.columns.join('\n'))).toContain('会员到期')
  })
})
