import base64url from 'base64url'
import crypto from 'crypto'
import querystring from 'querystring'

export function createFlecktarnUrl(url, {rootUrl, hmacSecret}) {
  const signature = base64url.encode(crypto.createHmac('sha224', hmacSecret).update(url).digest())

  return `${rootUrl}/${signature}/${querystring.escape(url)}`
}
