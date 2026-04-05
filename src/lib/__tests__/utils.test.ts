import { formatMatchDate, formatMatchDateShort, cn, getFormColor, parseForm, calculatePoints } from '../utils'

describe('utils', () => {
  it('formatMatchDate returns readable date', () => {
    const result = formatMatchDate('2026-06-11T15:00:00Z')
    expect(result).toMatch(/Jun/)
    expect(result).toMatch(/2026/)
  })

  it('formatMatchDateShort returns short month and day', () => {
    const result = formatMatchDateShort('2026-06-11T15:00:00Z')
    expect(result).toMatch(/Jun/)
    expect(result).toMatch(/11/)
  })

  it('cn merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
    expect(cn('foo', undefined, 'bar')).toBe('foo bar')
    expect(cn('foo', false, 'bar')).toBe('foo bar')
  })

  it('getFormColor returns correct color class', () => {
    expect(getFormColor('W')).toBe('bg-green-500')
    expect(getFormColor('D')).toBe('bg-yellow-500')
    expect(getFormColor('L')).toBe('bg-red-500')
    expect(getFormColor('X')).toBe('bg-red-500') // fallback
  })

  it('parseForm splits form string into array', () => {
    expect(parseForm('WWDLW')).toEqual(['W', 'W', 'D', 'L', 'W'])
    expect(parseForm('WDL')).toEqual(['W', 'D', 'L'])
    expect(parseForm('')).toEqual([])
  })

  it('calculatePoints computes correctly', () => {
    expect(calculatePoints(3, 1)).toBe(10) // 3*3 + 1
    expect(calculatePoints(0, 0)).toBe(0)
    expect(calculatePoints(2, 2)).toBe(8)
  })
})
