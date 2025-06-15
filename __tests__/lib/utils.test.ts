import { formatReadingTime, formatProgress } from '../../lib/utils'

describe('formatReadingTime', () => {
  it('should format minutes correctly', () => {
    expect(formatReadingTime(30)).toBe('30m')
    expect(formatReadingTime(45)).toBe('45m')
    expect(formatReadingTime(0)).toBe('0m')
  })

  it('should format hours correctly', () => {
    expect(formatReadingTime(60)).toBe('1h')
    expect(formatReadingTime(120)).toBe('2h')
    expect(formatReadingTime(90)).toBe('1h 30m')
    expect(formatReadingTime(150)).toBe('2h 30m')
  })

  it('should handle edge cases', () => {
    expect(formatReadingTime(59)).toBe('59m')
    expect(formatReadingTime(61)).toBe('1h 1m')
    expect(formatReadingTime(1440)).toBe('24h')
  })
})

describe('formatProgress', () => {
  it('should format progress as percentage', () => {
    expect(formatProgress(0)).toBe('0%')
    expect(formatProgress(50)).toBe('50%')
    expect(formatProgress(100)).toBe('100%')
    expect(formatProgress(25.5)).toBe('26%')
    expect(formatProgress(99.9)).toBe('100%')
  })

  it('should handle edge cases', () => {
    expect(formatProgress(-10)).toBe('0%')
    expect(formatProgress(150)).toBe('150%')
  })
}) 