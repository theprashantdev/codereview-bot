import crypto from 'crypto'
import { verifyWebhookSignature } from '../src/utils/hmac'

describe('verifyWebhookSignature', () => {
  const secret = 'test_secret_123'

  function makeSignature(body: Buffer, s: string): string {
    return `sha256=${crypto.createHmac('sha256', s).update(body).digest('hex')}`
  }

  it('returns true for a valid signature', () => {
    const body = Buffer.from(JSON.stringify({ action: 'opened' }))
    const sig = makeSignature(body, secret)
    expect(verifyWebhookSignature(body, sig, secret)).toBe(true)
  })

  it('returns false for a tampered body', () => {
    const body = Buffer.from('{"action":"opened"}')
    const tampered = Buffer.from('{"action":"closed"}')
    const sig = makeSignature(body, secret)
    expect(verifyWebhookSignature(tampered, sig, secret)).toBe(false)
  })

  it('returns false for wrong secret', () => {
    const body = Buffer.from('payload')
    const sig = makeSignature(body, 'wrong_secret')
    expect(verifyWebhookSignature(body, sig, secret)).toBe(false)
  })

  it('returns false for malformed signature string', () => {
    const body = Buffer.from('payload')
    expect(verifyWebhookSignature(body, 'not-a-real-sig', secret)).toBe(false)
  })
})
