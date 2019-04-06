import crypto from 'crypto'

export function hmac(url) {
  const hash = crypto.createHmac('sha256', process.env.HMAC_SECRET)
  hash.update(url)
  return hash.digest('hex')
}
