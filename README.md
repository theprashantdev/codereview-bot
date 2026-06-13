# 🤖 CodeReview Bot

> Automatically reviews every pull request in your repo. Catches bugs, security vulnerabilities, and style issues before humans even look at the code.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?style=flat-square&logo=typescript)]()
[![Node.js](https://img.shields.io/badge/Node.js-20-green?style=flat-square&logo=node.js)]()
[![GitHub App](https://img.shields.io/badge/GitHub-App-black?style=flat-square&logo=github)]()
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

## What It Does

Whenever a PR is opened or updated:
1. CodeReview Bot reads the diff
2. Sends it to an LLM with structured review instructions
3. Posts inline comments on specific lines with detected issues
4. Adds a summary review comment with overall quality score
5. Labels the PR: `needs-changes` / `looks-good` / `security-risk`

## Example Output

The bot posts a review like this on every PR:

```
## 🤖 CodeReview Bot Analysis

**Overall Score: 7.2/10**

### 🔴 Critical Issues (2)
- Line 47: SQL query built with string concatenation — SQL injection risk
- Line 89: API key hardcoded in source file

### 🟡 Warnings (3)
- Line 23: Function has 127 lines — consider splitting
- Line 55: Unhandled promise rejection
- Line 71: Deprecated dependency `request` — use `axios` or `httpx`

### 🟢 Suggestions (2)
- Line 12: `async/await` preferred over `.then()` chains
- Line 34: Variable name `d` is not descriptive
```

## Setup

### 1. Create a GitHub App

1. Go to GitHub Settings → Developer settings → GitHub Apps → New GitHub App
2. Set **Webhook URL** to your server URL + `/webhook`
3. Enable permissions: **Pull requests** (read & write), **Contents** (read)
4. Subscribe to events: `pull_request`
5. Download the private key

### 2. Deploy

```bash
git clone https://github.com/theprashantdev/codereview-bot
cd codereview-bot
npm install
cp .env.example .env  # fill in GitHub App credentials + OpenRouter key
npm run build
npm start
```

### 3. Install

Install the GitHub App on any repository. Every new PR will be reviewed automatically.

## Environment Variables

```env
GITHUB_APP_ID=your_app_id
GITHUB_PRIVATE_KEY_PATH=./private-key.pem
GITHUB_WEBHOOK_SECRET=your_webhook_secret
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_MODEL=openai/gpt-4o-mini
PORT=3000
```

## Architecture

```
 GitHub PR opened
       │
       ▼
 GitHub Webhook ───►  Express Server  ───►  Diff Parser
                         │                        │
                         ▼                        ▼
                    Verify HMAC              OpenRouter API
                    signature                (Code Review)
                         │                        │
                         ▼                        ▼
                    GitHub API  ◀────── Review Formatter
                    (post review)
```

## Review Categories

| Category | Examples |
|----------|----------|
| **Security** | SQL injection, hardcoded secrets, insecure crypto, XSS |
| **Bugs** | Null pointer risks, off-by-one, unhandled errors |
| **Performance** | N+1 queries, blocking I/O in async context |
| **Style** | Long functions, poor naming, dead code |
| **Dependencies** | Deprecated packages, known vulnerabilities |

## Project Structure

```
codereview-bot/
├── src/
│   ├── index.ts              # Express server + webhook handler
│   ├── github/
│   │   ├── app.ts            # GitHub App auth
│   │   ├── diff.ts           # PR diff parser
│   │   └── reviewer.ts       # Posts review comments
│   ├── ai/
│   │   └── analyze.ts        # LLM code analysis
│   └── utils/
│       └── hmac.ts           # Webhook signature verification
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## License

MIT © [Prashant Raj](https://github.com/theprashantdev)
