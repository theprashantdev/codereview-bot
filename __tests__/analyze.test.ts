import axios from 'axios'
import { analyzeCode } from '../src/ai/analyze'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

const MOCK_RESPONSE = {
  data: {
    choices: [{
      message: {
        content: JSON.stringify({
          score: 7.5,
          summary: 'Good code with minor issues.',
          issues: [
            { category: 'security', severity: 'warning', location: 'line 10', description: 'Unvalidated input' }
          ]
        })
      }
    }]
  }
}

describe('analyzeCode', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns parsed analysis from OpenRouter response', async () => {
    mockedAxios.post = jest.fn().mockResolvedValue(MOCK_RESPONSE)
    const result = await analyzeCode('+ const x = eval(input)', 'test_key', 'openai/gpt-4o-mini')
    expect(result.score).toBe(7.5)
    expect(result.summary).toBe('Good code with minor issues.')
    expect(result.issues).toHaveLength(1)
    expect(result.issues[0].severity).toBe('warning')
  })

  it('throws if API key is empty', async () => {
    await expect(analyzeCode('diff', '', 'model')).rejects.toThrow('OPENROUTER_API_KEY is not set')
  })

  it('throws with descriptive error on 401', async () => {
    const err: any = new Error('Unauthorized')
    err.response = { status: 401 }
    mockedAxios.post = jest.fn().mockRejectedValue(err)
    await expect(analyzeCode('diff', 'bad_key', 'model')).rejects.toThrow('Invalid OPENROUTER_API_KEY')
  })

  it('throws descriptive error on timeout', async () => {
    const err: any = new Error('timeout')
    err.code = 'ECONNABORTED'
    mockedAxios.post = jest.fn().mockRejectedValue(err)
    await expect(analyzeCode('diff', 'key', 'model')).rejects.toThrow('OpenRouter API timeout')
  })
})
