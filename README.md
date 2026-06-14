# CodeReview Bot

> A GitHub App that automatically reviews every pull request. Detects bugs, security issues, performance problems, and style violations using an LLM via OpenRouter.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?style=flat-square&logo=typescript)]()
[![Node.js](https://img.shields.io/badge/Node.js-20-green?style=flat-square&logo=node.js)]()
[![GitHub App](https://img.shields.io/badge/GitHub-App-black?style=flat-square&logo=github)]()
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)
[![CI](https://github.com/theprashantdev/codereview-bot/actions/workflows/ci.yml/badge.svg)](https://github.com/theprashantdev/codereview-bot/actions/workflows/ci.yml)

## What It Does

Whenever a PR is opened or updated:
1. GitHub sends a webhook to the bot
2. The bot fetches the PR diff using the GitHub App installation token
3. The diff is sent to an LLM (via OpenRouter) with structured review instructions
4. The bot posts a review comment with a quality score and categorized issues
5. If critical issues are found, the bot requests changes; otherwise it posts a comment

## Example Review Output

```
## \u{1F916} CodeReview Bot Analysis
**Overall Score: 6.8/10**
> Two security issues found. Refactoring recommended.

### \u{1F534} Critical Issues (1)
- line 47 in auth.ts: SQL query built with string concatenation \u2014 SQL injection risk

### \u{1F7E1} Warnings (2)
- line 23 in service.ts: Function has 140 lines \u2014 consider splitting
- line 55 in api.ts: Unhandled promise rejection
```

## Setup

### 1. Create a GitHub App

1. Go to **GitHub Settings \u2192 Developer settings \u2192 GitHub Apps \u2192 New GitHub App**
2. Set **Webhook URL** to `https://your-server.com/webhook`
3. Set **Webhook secret** (save this value for `GITHUB_WEBHOOK_SECRET`)
4. Grant permissions: **Pull requests** \u2192 Read & write, **Contents** \u2192 Read
5. Subscribe to events: `Pull request`
6. Click **Create GitHub App**
7. Note the **App ID** (for `GITHUB_APP_ID`)
8. Click **Generate a private key** \u2192 download the `.pem` file

### 2. Configure Environment

```bash
git clone https://github.com/theprashantdev/codereview-bot
cd codereview-bot
npm install
cp .env.example .env
```

Edit `.env`:

```env
GITHUB_APP_ID=123456
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...paste key here...\n-----END RSA PRIVATE KEY-----"
GITHUB_WEBHOOK_SECRET=your_webhook_secret
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=openai/gpt-4o-mini
PORT=3000
```

The private key content should have literal `\n` (escaped) when stored in a single `.env` line.

### 3. Build and Run

```bash
npm run build
npm start
# or for development:
npm run dev
```

### 4. Install the App

Go to your GitHub App settings \u2192 **Install App** \u2192 select the repos you want reviewed.

Every new PR in those repos will be reviewed automatically.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GITHUB_APP_ID` | Yes | Your GitHub App's numeric ID |
| `GITHUB_PRIVATE_KEY` | Yes | RSA private key content (with `\n` escaping) |
| `GITHUB_WEBHOOK_SECRET` | Yes | Secret set when creating the app |
| `OPENROUTER_API_KEY` | Yes | Your OpenRouter API key |
| `OPENROUTER_MODEL` | No | Model to use (default: `openai/gpt-4o-mini`) |
| `PORT` | No | Port to listen on (default: `3000`) |

## Running Tests

```bash
npm test
```

Tests cover HMAC verification, diff truncation, and the AI analysis function with mocked HTTP calls. No API key or GitHub credentials needed.

## Docker

```bash
docker build -t codereview-bot .
docker run -p 3000:3000 --env-file .env codereview-bot
```

## Architecture

```
GitHub PR opened/updated
         │
         ▼
  POST /webhook
  (HMAC signature verified)
         │
         ▼
  Fetch PR diff
  (GitHub App installation token)
         │
         ▼
  Truncate diff (max 12,000 chars)
         │
         ▼
  OpenRouter LLM Analysis
  (score + summary + issues)
         │
         ▼
  Post GitHub Review
  (COMMENT or REQUEST_CHANGES)
```

## Project Structure

```
codereview-bot/
\u251c\u2500\u2500 src/
\u2502   \u251c\u2500\u2500 index.ts              # Express server + webhook handler
\u2502   \u251c\u2500\u2500 github/
\u2502   \u2502   \u251c\u2500\u2500 app.ts            # GitHub App installation auth
\u2502   \u2502   \u251c\u2500\u2500 diff.ts           # PR diff parser + truncator
\u2502   \u2502   \u2514\u2500\u2500 reviewer.ts       # Posts review comments
\u2502   \u251c\u2500\u2500 ai/
\u2502   \u2502   \u2514\u2500\u2500 analyze.ts        # LLM code analysis via OpenRouter
\u2502   \u2514\u2500\u2500 utils/
\u2502       \u2514\u2500\u2500 hmac.ts           # Webhook signature verification
\u251c\u2500\u2500 __tests__/
\u2502   \u251c\u2500\u2500 hmac.test.ts
\u2502   \u251c\u2500\u2500 diff.test.ts
\u2502   \u2514\u2500\u2500 analyze.test.ts
\u251c\u2500\u2500 jest.config.js
\u251c\u2500\u2500 package.json
\u251c\u2500\u2500 tsconfig.json
\u251c\u2500\u2500 Dockerfile
\u2514\u2500\u2500 .env.example
```

## License

MIT \u00a9 [Prashant Raj](https://github.com/theprashantdev)
