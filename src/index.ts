import 'dotenv/config'
import express, { Request, Response } from 'express'
import { verifyWebhookSignature } from './utils/hmac'
import { truncateDiff } from './github/diff'
import { analyzeCode } from './ai/analyze'
import { postReview } from './github/reviewer'
import { getInstallationOctokit } from './github/app'

const app = express()

app.use(
  express.raw({
    type: 'application/json'
  })
)

const PORT = process.env.PORT || '3000'

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'codereview-bot'
  })
})

app.post('/webhook', async (req: Request, res: Response) => {
  console.log('==============================')
  console.log('Webhook received')
  console.log('Event:', req.headers['x-github-event'])
  console.log('==============================')

  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET
  const apiKey = process.env.OPENROUTER_API_KEY
  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini'

  if (!webhookSecret) {
    console.error('Missing GITHUB_WEBHOOK_SECRET')
    return res.status(500).send('GITHUB_WEBHOOK_SECRET not configured')
  }

  if (!apiKey) {
    console.error('Missing OPENROUTER_API_KEY')
    return res.status(500).send('OPENROUTER_API_KEY not configured')
  }

  const signature = req.headers['x-hub-signature-256'] as string

  if (
    !verifyWebhookSignature(
      req.body as Buffer,
      signature,
      webhookSecret
    )
  ) {
    console.error('Webhook signature failed')
    return res.status(401).send('Unauthorized')
  }

  const event = req.headers['x-github-event']

  if (event !== 'pull_request') {
    console.log('Ignoring event:', event)
    return res.sendStatus(200)
  }

  const payload = JSON.parse(
    (req.body as Buffer).toString()
  )

  const {
    action,
    pull_request: pr,
    repository,
    installation
  } = payload

  console.log('PR action:', action)

  if (!['opened', 'synchronize'].includes(action)) {
    console.log('Ignoring action:', action)
    return res.sendStatus(200)
  }

  res.sendStatus(202)

  try {
    const installationId = installation?.id

    console.log('Installation ID:', installationId)

    if (!installationId) {
      console.error('No installation ID')
      return
    }

    const octokit: any =
      await getInstallationOctokit(installationId)

    console.log('Octokit created')

    const owner = repository.owner.login
    const repo = repository.name
    const pullNumber = pr.number

    console.log(
      `Fetching files for ${owner}/${repo} PR #${pullNumber}`
    )

    const filesRes = await octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: pullNumber
    })

    console.log(
      `Files fetched: ${filesRes.data.length}`
    )

    const diff = truncateDiff(filesRes.data as any)

    if (!diff.trim()) {
      console.log('Empty diff')
      return
    }

    console.log('Running AI analysis')

    const analysis = await analyzeCode(
      diff,
      apiKey,
      model
    )

    console.log('AI analysis complete')

    await postReview(
      octokit,
      owner,
      repo,
      pullNumber,
      analysis.score,
      analysis.summary,
      analysis.issues
    )

    console.log('Review posted successfully')
  } catch (err) {
    console.error('Review failed:', err)
  }
})

if (require.main === module) {
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET
  const apiKey = process.env.OPENROUTER_API_KEY

  if (!webhookSecret) {
    console.error(
      'FATAL: GITHUB_WEBHOOK_SECRET is not set'
    )
    process.exit(1)
  }

  if (!apiKey) {
    console.error(
      'FATAL: OPENROUTER_API_KEY is not set'
    )
    process.exit(1)
  }

  app.listen(parseInt(PORT, 10), () => {
    console.log(
      `CodeReview Bot running on port ${PORT}`
    )
  })
}

export { app }
