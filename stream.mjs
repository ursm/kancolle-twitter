import Handlebars from 'handlebars'
import Twitter from 'twitter-lite'
import dedent from 'dedent'
import fetch from 'node-fetch'

import { createFlecktarnUrl } from './util'

const template = Handlebars.compile(dedent`
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

export default function({idobata, twitter, flecktarn}) {
  const stream = new Twitter(twitter.keys).stream('statuses/filter', {
    follow:     twitter.follow,
    tweet_mode: 'extended'
  })

  stream.on('data', async (tweet) => {
    if (tweet.user.id_str !== twitter.follow) { return }

    console.log(`https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`)

    if (tweet.extended_tweet) {
      tweet.text = tweet.extended_tweet.full_text.slice(...tweet.extended_tweet.display_text_range)
    }

    const photoUrls = tweet.extended_entities ? tweet.extended_entities.media.filter(({type}) => (
      type === 'photo'
    )).map(({media_url_https}) => createFlecktarnUrl(media_url_https, flecktarn)) : []

    await fetch(idobata.hookEndpoint, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source: template({...tweet, photoUrls}).trimEnd(),
        format: 'html'
      })
    })
  })

  stream.on('error', (e) => {
    console.error(e)
  })

  return stream
}
