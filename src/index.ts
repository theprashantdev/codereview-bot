import 'dotenv/config'
import express, { Request, Response } from 'express'
import { Octokit } from '@octokit/rest'
import { verifyWebhookSignature } from './utils/hmac'
import { truncateDiff } from './github/diff'
import { analyzeCode } from './ai/analyze'
import { postReview } from './github/reviewer'

const app = express()
app.use(express.raw({ type: 'application/json' }))

const {
  GITHUB_APP_ID, GITHUB_WEBHOOK_SECRET, OPENROUTER_API_KEY,
  OPENROUTER_MODEL = 'openai/gpt-4o-mini', PORT = '3000'
} = process.env

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'codereview-bot' })
})

app.post('/webhook', async (req: Request, res: Response) => {
  const signature = req.headers['x-hub-signature-256'] as string
  if (!verifyWebhookSignature(req.body as Buffer, signature, GITHUB_WEBHOOK_SECRET!)) {
    return res.status(401).send('Unauthorized')
  }

  const event = req.headers['x-github-event']
  if (event !== 'pull_request') return res.sendStatus(200)

  const payload = JSON.parse((req.body as Buffer).toString())
  const { action, pull_request: pr, repository, installation } = payload

  if (!['opened', 'synchronize'].includes(action)) return res.sendStatus(200)
  res.sendStatus(202) // Respond immediately, process async

  try {
    // In production: use @octokit/app for installation auth
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })
    const owner = repository.owner.login
    const repo = repository.name
    const pullNumber = pr.number

    const filesRes = await octokit.pulls.listFiles({ owner, repo, pull_number: pullNumber })
    const diff = truncateDiff(filesRes.data as any)
    if (!diff.trim()) return

    const analysis = await analyzeCode(diff, OPENROUTER_API_KEY!, OPENROUTER_MODEL)
    await postReview(octokit, owner, repo, pullNumber, analysis.score, analysis.summary, analysis.issues)
  } catch (err) {
    console.error('Review failed:', err)
  }
})

app.listen(parseInt(PORT), () => console.log(`CodeReview Bot running on port ${PORT}`))
