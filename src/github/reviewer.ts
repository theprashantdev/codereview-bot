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

  const fmt = (items: Issue[]) => items.map(i => `- **${i.location}**: ${i.description}`).join('\n')

  return [
    `## \u{1F916} CodeReview Bot Analysis`,
    `**Overall Score: ${score.toFixed(1)}/10**`,
    `> ${summary}`,
    critical.length ? `\n### \ud83d\udd34 Critical Issues (${critical.length})\n${fmt(critical)}` : '',
    warnings.length ? `\n### \ud83d\udfe1 Warnings (${warnings.length})\n${fmt(warnings)}` : '',
    suggestions.length ? `\n### \ud83d\udfe2 Suggestions (${suggestions.length})\n${fmt(suggestions)}` : '',
    `\n---\n*Reviewed by [CodeReview Bot](https://github.com/theprashantdev/codereview-bot)*`
  ].filter(Boolean).join('\n')
}

export async function postReview(
  octokit: Octokit,
  owner: string,
  repo: string,
  pullNumber: number,
  score: number,
  summary: string,
  issues: Issue[]
) {
  const body = buildReviewBody(score, summary, issues)
  const event = issues.some(i => i.severity === 'critical') ? 'REQUEST_CHANGES' : 'COMMENT'
  await octokit.pulls.createReview({ owner, repo, pull_number: pullNumber, body, event })
}
