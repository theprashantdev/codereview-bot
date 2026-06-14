import crypto from 'crypto'
import { verifyWebhookSignature } from '../src/utils/hmac'

const SECRET = 'test_webhook_secret'

function makeSignature(payload: Buffer, secret: string): string {
  return `sha256=${crypto.createHmac('sha256', secret).update(payload).digest('hex')}`
}

describe('verifyWebhookSignature', () => {
  it('returns true for a valid signature', () => {
    const payload = Buffer.from(JSON.stringify({ action: 'opened' }))
    const sig = makeSignature(payload, SECRET)
    expect(verifyWebhookSignature(payload, sig, SECRET)).toBe(true)
  })

  it('returns false for an invalid signature', () => {
    const payload = Buffer.from(JSON.stringify({ action: 'opened' }))
    expect(verifyWebhookSignature(payload, 'sha256=badhash', SECRET)).toBe(false)
  })

  it('returns false for a tampered payload', () => {
    const original = Buffer.from(JSON.stringify({ action: 'opened' }))
    const sig = makeSignature(original, SECRET)
    const tampered = Buffer.from(JSON.stringify({ action: 'closed' }))
    expect(verifyWebhookSignature(tampered, sig, SECRET)).toBe(false)
  })

  it('returns false for empty signature', () => {
    const payload = Buffer.from('test')
    expect(verifyWebhookSignature(payload, '', SECRET)).toBe(false)
  })
})
