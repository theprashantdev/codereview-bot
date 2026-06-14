import { Octokit } from '@octokit/rest'

interface Issue {
  category: string
  severity: string
  location: string
  description: string
}

function buildReviewBody(score: number, summary: string, issues: Issue[]): string {
  const critical = issues.filter(i => i.severity === 'critical')
  const warnings = issues.filter(i => i.severity === 'warning')
  const suggestions = issues.filter(i => i.severity === 'suggestion')

  const fmt = (items: Issue[]) =>
    items.map(i => `- **${i.location}**: ${i.description}`).join('\n')

  const sections = [
    `## \u{1F916} CodeReview Bot Analysis`,
    `**Overall Score: ${score.toFixed(1)}/10**`,
    `> ${summary}`,
  ]

  if (critical.length) sections.push(`\n### \u{1F534} Critical Issues (${critical.length})\n${fmt(critical)}`)
  if (warnings.length) sections.push(`\n### \u{1F7E1} Warnings (${warnings.length})\n${fmt(warnings)}`)
  if (suggestions.length) sections.push(`\n### \u{1F7E2} Suggestions (${suggestions.length})\n${fmt(suggestions)}`)

  sections.push(`\n---\n*Reviewed by [CodeReview Bot](https://github.com/theprashantdev/codereview-bot)*`)

  return sections.filter(Boolean).join('\n')
}

export async function postReview(
  octokit: Octokit,
  owner: string,
  repo: string,
  pullNumber: number,
  score: number,
  summary: string,
  issues: Issue[]
): Promise<void> {
  const body = buildReviewBody(score, summary, issues)
  const event = issues.some(i => i.severity === 'critical') ? 'REQUEST_CHANGES' : 'COMMENT'
  await octokit.pulls.createReview({ owner, repo, pull_number: pullNumber, body, event })
}
