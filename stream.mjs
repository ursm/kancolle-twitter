import Handlebars from 'handlebars'
import Twitter from 'twitter-lite'
import crypto from 'crypto'
import fetch from 'node-fetch'
import querystring from 'querystring'

const template = Handlebars.compile(`
  <img height="16" width="16" src="{{user.profile_image_url_https}}">
  <b>{{user.name}}</b> (<a href="https://twitter.com/{{user.screen_name}}">@{{user.screen_name}}</a>)<br>
  <p>{{{text}}} (<a href="https://twitter.com/{{user.screen_name}}/status/{{id_str}}">link</a>)</p>

  {{#if photoUrls}}
    <ul class="list-inline">
      {{#each photoUrls as |url|}}
        <li>
          <a href="{{url}}">
            <img src="{{url}}" alt="">
          </a>
        </li>
      {{/each}}
    </ul>
  {{/if}}
`)

const twitter = new Twitter({
  consumer_key:        process.env.TWITTER_CONSUMER_KEY,
  consumer_secret:     process.env.TWITTER_CONSUMER_SECRET,
  access_token_key:    process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
})

const userId = process.env.TWITTER_USER_ID

const stream = twitter.stream('statuses/filter', {
  follow:     userId,
  tweet_mode: 'extended'
})

stream.on('data', async (tweet) => {
  if (tweet.user.id_str !== userId) { return }

  console.log(`https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`)

  if (tweet.extended_tweet) {
    tweet.text = tweet.extended_tweet.full_text.slice(...tweet.extended_tweet.display_text_range)
  }

  const photoUrls = tweet.extended_entities ? tweet.extended_entities.media.filter(({type}) => (
    type === 'photo'
  )).map(({media_url_https}) => (
    `${process.env.FLECKTARN_URL}/images/${hmac(media_url_https)}/${querystring.escape(media_url_https)}`
  )) : []

  await fetch(process.env.HOOK_ENDPOINT, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      source: template({...tweet, photoUrls}),
      format: 'html'
    })
  })
})

stream.on('error', (e) => {
  console.error(e)
})

process.on('SIGTERM', () => {
  stream.destroy()
  process.exit(0)
})

function hmac(url) {
  const hash = crypto.createHmac('sha224', process.env.FLECKTARN_HMAC_SECRET)
  hash.update(url)
  return hash.digest('hex')
}
