import { App } from '@octokit/app'

let githubApp: App | null = null

export function getGitHubApp(): App {
  if (!githubApp) {
    const appId = process.env.GITHUB_APP_ID
    const privateKey = process.env.GITHUB_PRIVATE_KEY
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET

    if (!appId || !privateKey || !webhookSecret) {
      throw new Error(
        'Missing required GitHub App env vars: GITHUB_APP_ID, GITHUB_PRIVATE_KEY, GITHUB_WEBHOOK_SECRET'
      )
    }

    githubApp = new App({
      appId: appId,
      privateKey: privateKey.replace(/\\n/g, '\n'),
      webhooks: {
        secret: webhookSecret
      }
    })
  }

  return githubApp
}

export async function getInstallationOctokit(
  installationId: number
): Promise<any> {
  const app = getGitHubApp()

  const octokit = await app.getInstallationOctokit(
    installationId
  )

  console.log(
    'Octokit methods:',
    Object.keys(octokit || {})
  )

  console.log(
    'Has rest:',
    !!(octokit as any).rest
  )

  return octokit as any
}
