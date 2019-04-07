import base64url from 'base64url'
import crypto from 'crypto'
import querystring from 'querystring'

export function createFlecktarnUrl(url, {url: rootURL, hmacSecret}) {
  const signature = base64url.encode(crypto.createHmac('sha224', hmacSecret).update(url).digest())

  return `${rootURL}/images/${signature}/${querystring.escape(url)}`
}
