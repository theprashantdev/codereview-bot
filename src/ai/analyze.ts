import axios, { AxiosError } from 'axios'

const REVIEW_PROMPT = `You are a senior software engineer doing a code review. Analyze this diff and identify:
1. Security vulnerabilities (SQL injection, hardcoded secrets, XSS, insecure patterns)
2. Bugs (null pointer risks, unhandled errors, logic errors, off-by-one)
3. Performance issues (N+1 queries, blocking async calls, memory leaks)
4. Code quality issues (overly long functions, poor naming, dead code)
5. Deprecated or risky dependencies

For each issue, specify: category, severity (critical/warning/suggestion), the approximate line or code fragment, and a brief explanation.

Respond in this JSON format:
{
  "score": 7.5,
  "summary": "Brief overall assessment",
  "issues": [
    {
      "category": "security",
      "severity": "critical",
      "location": "line 47 in auth.ts",
      "description": "SQL query built with string concatenation"
    }
  ]
}`

export async function analyzeCode(
  diff: string,
  apiKey: string,
  model: string
): Promise<{
  score: number
  summary: string
  issues: Array<{
    category: string
    severity: string
    location: string
    description: string
  }>
}> {
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set')
  }

  console.log('================================')
  console.log('OpenRouter request starting')
  console.log('Model:', model)
  console.log('Key prefix:', apiKey.substring(0, 15))
  console.log('================================')

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model,
        messages: [
          {
            role: 'system',
            content: REVIEW_PROMPT
          },
          {
            role: 'user',
            content: `Diff to review:\n${diff}`
          }
        ],
        response_format: {
          type: 'json_object'
        },
        temperature: 0.1
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    )

    console.log('OpenRouter request succeeded')

    const content =
      response.data.choices[0].message.content

    return JSON.parse(content)
  } catch (err) {
    const axiosErr = err as AxiosError

    console.error('================================')
    console.error('OPENROUTER ERROR')
    console.error('Status:', axiosErr.response?.status)
    console.error('Data:', axiosErr.response?.data)
    console.error('Code:', axiosErr.code)
    console.error('Message:', axiosErr.message)
    console.error('================================')

    throw err
  }
}
