import createStream from './stream.mjs'

const stream = createStream({
  idobata: {
    hookUrl: process.env.IDOBATA_HOOK_URL
  },
  twitter: {
    keys: {
      consumer_key:        process.env.TWITTER_CONSUMER_KEY,
      consumer_secret:     process.env.TWITTER_CONSUMER_SECRET,
      access_token_key:    process.env.TWITTER_ACCESS_TOKEN_KEY,
      access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    },
    followIds: process.env.TWITTER_FOLLOW_IDS.split(',')
  },
  flecktarn: {
    rootUrl:    process.env.FLECKTARN_ROOT_URL,
    hmacSecret: process.env.FLECKTARN_HMAC_SECRET
  }
})

process.on('SIGTERM', () => {
  stream.destroy()
  process.exit(0)
})
