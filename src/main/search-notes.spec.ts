import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { closeDatabase, createBoard, createCard, getAllNotes, getWorkspace, initializeDatabase, searchNotes } from './database'

const tempDirs: string[] = []

function createUserDataDir(): string {
  const path = mkdtempSync(join(tmpdir(), 'renyiqian-search-'))
  tempDirs.push(path)
  return path
}

afterEach(() => {
  closeDatabase()
  for (const path of tempDirs.splice(0)) {
    rmSync(path, { recursive: true, force: true })
  }
})

describe('searchNotes', () => {
  it('searches notes across all groups', () => {
    initializeDatabase(createUserDataDir())

    const firstWorkspace = getWorkspace()
    createCard(firstWorkspace.activeBoard.columns[0].id, {
      title: '客户回访',
      description: '电话 13800138000'
    })

    const secondWorkspace = createBoard({ title: '项目资料' })
    createCard(secondWorkspace.activeBoard.columns[0].id, {
      title: '合同信息',
      description: '客户名称 任意签'
    })

    const results = searchNotes('客户')

    expect(results).toHaveLength(2)
    expect(results.map((result) => result.boardTitle)).toContain('默认分组')
    expect(results.map((result) => result.boardTitle)).toContain('项目资料')
  })

  it('returns no results for a blank query', () => {
    initializeDatabase(createUserDataDir())

    expect(searchNotes('   ')).toEqual([])
  })

  it('lists notes across inactive groups for reminder checks', () => {
    initializeDatabase(createUserDataDir())

    const firstWorkspace = getWorkspace()
    createCard(firstWorkspace.activeBoard.columns[0].id, {
      title: '默认分组提醒',
      description: 'first reminder'
    })

    const secondWorkspace = createBoard({ title: '会员账号' })
    createCard(secondWorkspace.activeBoard.columns[0].id, {
      title: '会员到期提醒',
      description: 'inactive group reminder'
    })

    const notes = getAllNotes()

    expect(notes.map((note) => note.title)).toEqual(['会员到期提醒', '默认分组提醒'])
    expect(notes.map((note) => note.boardTitle)).toEqual(['会员账号', '默认分组'])
  })
})
