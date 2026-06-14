import { truncateDiff, DiffFile } from '../src/github/diff'

const makeFile = (filename: string, patch: string, status: 'added' | 'modified' | 'removed' = 'modified'): DiffFile => ({
  filename,
  status,
  additions: 5,
  deletions: 2,
  patch,
})

describe('truncateDiff', () => {
  it('returns diff content for modified files', () => {
    const files = [makeFile('src/index.ts', '+ const x = 1')]
    const result = truncateDiff(files)
    expect(result).toContain('src/index.ts')
    expect(result).toContain('+ const x = 1')
  })

  it('skips removed files', () => {
    const files = [makeFile('deleted.ts', '- const old = true', 'removed')]
    const result = truncateDiff(files)
    expect(result).not.toContain('deleted.ts')
  })

  it('truncates when total chars exceed maxChars', () => {
    const bigPatch = 'x'.repeat(5000)
    const files = [
      makeFile('file1.ts', bigPatch),
      makeFile('file2.ts', bigPatch),
      makeFile('file3.ts', bigPatch),
    ]
    const result = truncateDiff(files, 6000)
    expect(result.length).toBeLessThanOrEqual(6500)
  })

  it('returns empty string for all-removed files', () => {
    const files = [makeFile('gone.ts', '- x', 'removed')]
    expect(truncateDiff(files)).toBe('')
  })

  it('handles files with no patch', () => {
    const files = [{ filename: 'binary.png', status: 'added' as const, additions: 0, deletions: 0, patch: '' }]
    const result = truncateDiff(files)
    expect(result).toContain('binary.png')
  })
})
