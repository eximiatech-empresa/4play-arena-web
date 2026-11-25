import { describe, it, expect } from 'vitest'
import { isDemoDoc, excludeDemo, isOwnedByDemo, excludeDemoOwned } from '@/core/math/demo-filter'

describe('demo-filter', () => {
  it('isDemoDoc so aceita isDemo === true', () => {
    expect(isDemoDoc({ isDemo: true })).toBe(true)
    expect(isDemoDoc({ isDemo: false })).toBe(false)
    expect(isDemoDoc({ isDemo: 'true' })).toBe(false)
    expect(isDemoDoc({})).toBe(false)
    expect(isDemoDoc(null)).toBe(false)
    expect(isDemoDoc(undefined)).toBe(false)
  })

  it('excludeDemo remove demo por padrao e mantem com includeDemo', () => {
    const items = [{ id: 'a' }, { id: 'b', isDemo: true }, { id: 'c', isDemo: false }]
    expect(excludeDemo(items).map((i) => i.id)).toEqual(['a', 'c'])
    expect(excludeDemo(items, true).map((i) => i.id)).toEqual(['a', 'b', 'c'])
  })

  it('isOwnedByDemo identifica transacoes de usuarios demo pelos campos de dono', () => {
    const demoIds = new Set(['demo-aluno', 'demo-prof'])
    expect(isOwnedByDemo({ studentId: 'demo-aluno' }, demoIds)).toBe(true)
    expect(isOwnedByDemo({ teacherId: 'demo-prof' }, demoIds)).toBe(true)
    expect(isOwnedByDemo({ targetId: 'demo-aluno' }, demoIds)).toBe(true)
    expect(isOwnedByDemo({ studentId: 'real' }, demoIds)).toBe(false)
    expect(isOwnedByDemo({ studentId: 'demo-aluno' }, new Set())).toBe(false)
  })

  it('excludeDemoOwned remove flag demo e documentos de donos demo', () => {
    const demoIds = new Set(['demo-aluno'])
    const txs = [
      { id: 't1', studentId: 'real' },
      { id: 't2', studentId: 'demo-aluno' },
      { id: 't3', studentId: 'real', isDemo: true },
    ]
    expect(excludeDemoOwned(txs, demoIds).map((t) => t.id)).toEqual(['t1'])
  })
})
