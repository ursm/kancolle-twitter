import Handlebars from 'handlebars'
import Twitter from 'twitter-lite'
import fetch from 'node-fetch'

import { createFlecktarnUrl } from './util.mjs'

Handlebars.registerHelper('slice', (str, pos) => pos ? str.slice(pos[0], pos[1]) : str)
Handlebars.registerHelper('or', (x, y) => x || y)
Handlebars.registerHelper('ln2br', (str) => str.replace(/\n/g, '<br>'))

Handlebars.registerPartial('tweet-header', `
  <div>
    <img height="16" width="16" src="{{user.profile_image_url_https}}">
    <b>{{user.name}}</b>
    <a href="https://twitter.com/{{user.screen_name}}" class="text-muted">@{{user.screen_name}}</a>
    <span class="text-muted">·</span>
    <a href="https://twitter.com/{{user.screen_name}}/status/{{id_str}}" class="text-muted">source</a>
  </div>
`)

Handlebars.registerPartial('tweet-body', `
  {{#if extended_tweet}}
    {{#with (slice extended_tweet.full_text extended_tweet.display_text_range) as |text|}}
      <p>{{{ln2br text}}}</p>
    {{/with}}
  {{else}}
    {{#with (slice text display_text_range) as |text|}}
      <p>{{{ln2br text}}}</p>
    {{/with}}
  {{/if}}

  {{#with (or extended_tweet.extended_entities.media extended_entities.media) as |objs|}}
    <ul class="list-inline">
      {{#each objs as |obj|}}
        <li>
          <a href="{{obj.expanded_url}}">
            <img src="{{flecktarn-url obj.media_url_https}}" width="{{obj.sizes.medium.w}}" height="{{obj.sizes.medium.h}}" alt="">
          </a>
        </li>
      {{/each}}
    </ul>
  {{/with}}
`)

const template = Handlebars.compile(`
  {{> tweet-header }}

  {{#if retweeted_status}}
    <div class="panel panel-default">
      <div class="panel-body">
        {{> tweet-header retweeted_status }}
        {{> tweet-body retweeted_status }}
      </div>
    </div>
  {{else}}
    {{> tweet-body }}
  {{/if}}
`)

function log(fn) {
  if (process.env.NODE_ENV === 'test') { return }

  console.log(fn())
}

export default function(config) {
  Handlebars.registerHelper('flecktarn-url', (url) => createFlecktarnUrl(url, config.flecktarn))

  const stream = new Twitter(config.twitter.keys).stream('statuses/filter', {
    follow: config.twitter.followIds.join(',')
  })

  stream.on('data', async (payload) => {
    try {
      if (!payload.user) { return }
      if (!config.twitter.followIds.includes(payload.user.id_str)) { return }

      log(() => JSON.stringify(payload, null, '  '))

      await fetch(config.idobata.hookUrl, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          source: template(payload).trimEnd(),
          format: 'html'
        })
      })
    } catch (e) {
      console.error(e, payload);
    }
  })

  stream.on('error', (e) => {
    console.error(e)
  })

  return stream
}
