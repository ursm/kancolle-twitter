import createStream from './stream'

const stream = createStream({
  idobata: {
    hookEndpoint: process.env.HOOK_ENDPOINT
  },
  twitter: {
    keys: {
      consumer_key:        process.env.TWITTER_CONSUMER_KEY,
      consumer_secret:     process.env.TWITTER_CONSUMER_SECRET,
      access_token_key:    process.env.TWITTER_ACCESS_TOKEN_KEY,
      access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    },
    followIds: process.env.TWITTER_USER_ID.split(',')
  },
  flecktarn: {
    url:        process.env.FLECKTARN_URL,
    hmacSecret: process.env.FLECKTARN_HMAC_SECRET
  }
})

process.on('SIGTERM', () => {
  stream.destroy()
  process.exit(0)
})
