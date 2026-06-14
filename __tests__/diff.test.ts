import { truncateDiff } from '../src/github/diff'
import type { DiffFile } from '../src/github/diff'

const makeFile = (filename: string, patch: string, additions = 5, deletions = 2): DiffFile => ({
  filename,
  status: 'modified',
  additions,
  deletions,
  patch,
})

describe('truncateDiff', () => {
  it('includes all files when under the limit', () => {
    const files: DiffFile[] = [
      makeFile('a.ts', '+ const x = 1'),
      makeFile('b.ts', '+ const y = 2'),
    ]
    const result = truncateDiff(files)
    expect(result).toContain('a.ts')
    expect(result).toContain('b.ts')
  })

  it('skips removed files', () => {
    const files: DiffFile[] = [{ filename: 'deleted.ts', status: 'removed', additions: 0, deletions: 10, patch: '' }]
    const result = truncateDiff(files)
    expect(result).not.toContain('deleted.ts')
  })

  it('truncates when total length exceeds maxChars', () => {
    const bigPatch = 'x'.repeat(8000)
    const files: DiffFile[] = [
      makeFile('first.ts', bigPatch),
      makeFile('second.ts', bigPatch),
    ]
    const result = truncateDiff(files, 10000)
    expect(result).toContain('first.ts')
    expect(result).not.toContain('second.ts')
  })

  it('returns empty string for empty files array', () => {
    expect(truncateDiff([])).toBe('')
  })

  it('handles file with no patch gracefully', () => {
    const files: DiffFile[] = [makeFile('bin.ts', '')]
    const result = truncateDiff(files)
    expect(result).toContain('bin.ts')
  })
})
