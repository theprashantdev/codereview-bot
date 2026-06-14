import 'dotenv/config'
import express, { Request, Response } from 'express'
import { verifyWebhookSignature } from './utils/hmac'
import { truncateDiff } from './github/diff'
import { analyzeCode } from './ai/analyze'
import { postReview } from './github/reviewer'
import { getInstallationOctokit } from './github/app'

const app = express()
app.use(express.raw({ type: 'application/json' }))

const {
  GITHUB_WEBHOOK_SECRET,
  OPENROUTER_API_KEY,
  OPENROUTER_MODEL = 'openai/gpt-4o-mini',
  PORT = '3000'
} = process.env

if (!GITHUB_WEBHOOK_SECRET) {
  console.error('FATAL: GITHUB_WEBHOOK_SECRET is not set')
  process.exit(1)
}
if (!OPENROUTER_API_KEY) {
  console.error('FATAL: OPENROUTER_API_KEY is not set')
  process.exit(1)
}

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'codereview-bot' })
})

app.post('/webhook', async (req: Request, res: Response) => {
  const signature = req.headers['x-hub-signature-256'] as string
  if (!GITHUB_WEBHOOK_SECRET || !verifyWebhookSignature(req.body as Buffer, signature, GITHUB_WEBHOOK_SECRET)) {
    return res.status(401).send('Unauthorized')
  }

  const event = req.headers['x-github-event']
  if (event !== 'pull_request') return res.sendStatus(200)

  const payload = JSON.parse((req.body as Buffer).toString())
  const { action, pull_request: pr, repository, installation } = payload

  if (!['opened', 'synchronize'].includes(action)) return res.sendStatus(200)
  res.sendStatus(202)

  try {
    const installationId = installation?.id
    if (!installationId) {
      console.error('No installation ID in webhook payload')
      return
    }

    const octokit = await getInstallationOctokit(installationId)
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

export { app }
