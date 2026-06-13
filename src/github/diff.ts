export interface DiffFile {
  filename: string
  status: 'added' | 'modified' | 'removed'
  additions: number
  deletions: number
  patch: string
}

export function truncateDiff(files: DiffFile[], maxChars = 12000): string {
  const lines: string[] = []
  let total = 0
  for (const file of files) {
    if (file.status === 'removed') continue
    const entry = `\n--- ${file.filename} ---\n${file.patch || '(binary or no patch)'}\n`
    if (total + entry.length > maxChars) break
    lines.push(entry)
    total += entry.length
  }
  return lines.join('')
}
