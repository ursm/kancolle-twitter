import Handlebars from 'handlebars'
import Twitter from 'twitter-lite'
import dedent from 'dedent'
import fetch from 'node-fetch'

import { createFlecktarnUrl } from './util'

const template = Handlebars.compile(dedent`
  <img height="16" width="16" src="{{user.profile_image_url_https}}">
  <b>{{user.name}}</b> (<a href="https://twitter.com/{{user.screen_name}}">@{{user.screen_name}}</a>)<br>
  <p>{{#if extended_tweet}}{{extended_tweet.full_text}}{{else}}{{text}}{{/if}} (<a href="https://twitter.com/{{user.screen_name}}/status/{{id_str}}">link</a>)</p>

  {{#if extended_entities.media}}
    <ul class="list-inline">
      {{#each extended_entities.media as |media|}}
        <li>
          <a href="{{media.expanded_url}}">
            <img src="{{flecktarn-url media.media_url_https}}" alt="">
          </a>
        </li>
      {{/each}}
    </ul>
  {{/if}}
`)

export default function({idobata, twitter, flecktarn}) {
  Handlebars.registerHelper('flecktarn-url', (url) => createFlecktarnUrl(url, flecktarn))

  const stream = new Twitter(twitter.keys).stream('statuses/filter', {
    follow:     twitter.follow,
    tweet_mode: 'extended'
  })

  stream.on('data', async (tweet) => {
    if (tweet.user.id_str !== twitter.follow) { return }

    if (process.env.NODE_ENV !== 'test') {
      console.log(`https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`)
    }

    await fetch(idobata.hookEndpoint, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source: template(tweet).trimEnd(),
        format: 'html'
      })
    })
  })

  stream.on('error', (e) => {
    console.error(e)
  })

  return stream
}
