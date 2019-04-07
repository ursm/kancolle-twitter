import fetch from 'node-fetch'

import createStream from '../stream'
import { createFlecktarnUrl } from '../util'

jest.mock('node-fetch')
jest.mock('twitter-lite')

const config = {
  idobata: {
    hookEndpoint: 'http://example.com/idobata-hook'
  },
  twitter: {
    follow: 'FOLLOW_USER_ID'
  },
  flecktarn: {
    url:        'http://example.com/flecktarn',
    hmacSecret: 'SECRET'
  }
}

let stream

beforeEach(() => {
  fetch.mockReset()

  stream = createStream(config)
})

describe('on tweet', () => {
  test('anyone else', () => {
    stream.emit('data', {
      user: {
        id_str: 'SOMEBODY_ID'
      }
    })

    expect(fetch).not.toHaveBeenCalled()
  })

  test('simple', () => {
    stream.emit('data', {
      user: {
        id_str: 'FOLLOW_USER_ID',
        profile_image_url_https: 'http://example.com/profile.png',
        name: 'Alice Liddell',
        screen_name: 'alice',
      },
      id_str: 'TWEET_ID',
      text: 'hello from the wonderland'
    })

    expect(fetch).toHaveBeenCalledTimes(1)

    const [url, {method, headers, body}] = fetch.mock.calls[0]
    const {source, format} = JSON.parse(body)

    expect(url).toBe('http://example.com/idobata-hook')
    expect(method).toBe('post')
    expect(headers).toEqual({'Content-Type': 'application/json'})
    expect(format).toBe('html')

    expect(source).toEqualWithUnindent(`
      <img height="16" width="16" src="http://example.com/profile.png">
      <b>Alice Liddell</b> (<a href="https://twitter.com/alice">@alice</a>)<br>
      <p>hello from the wonderland (<a href="https://twitter.com/alice/status/TWEET_ID">link</a>)</p>
    `)
  })

  test('extended', () => {
    stream.emit('data', {
      user: {
        id_str: 'FOLLOW_USER_ID',
        profile_image_url_https: 'http://example.com/profile.png',
        name: 'Alice Liddell',
        screen_name: 'alice',
      },
      id_str: 'TWEET_ID',
      text: 'hello from the wonderland',
      extended_tweet: {
        full_text: 'Alice taking "Drink Me" bottle',
        display_text_range: [14, 22],
      },
      extended_entities: {
        media: [
          {
            type: 'photo',
            media_url_https: 'http://example.com/photo/1.jpg',
            expanded_url: 'http://example.com/photo/1'
          },
          {
            type: 'video',
            media_url_https: 'http://example.com/video-thumbnail/1.jpg',
            expanded_url: 'http://example.com/video/1'
          }
        ]
      }
    })

    expect(fetch).toHaveBeenCalledTimes(1)

    const [, {body}] = fetch.mock.calls[0]
    const {source} = JSON.parse(body)

    expect(source).toEqualWithUnindent(`
      <img height="16" width="16" src="http://example.com/profile.png">
      <b>Alice Liddell</b> (<a href="https://twitter.com/alice">@alice</a>)<br>
      <p>Alice taking &quot;Drink Me&quot; bottle (<a href="https://twitter.com/alice/status/TWEET_ID">link</a>)</p>

      <ul class="list-inline">
        <li>
          <a href="http://example.com/photo/1">
            <img src="${createFlecktarnUrl('http://example.com/photo/1.jpg', config.flecktarn)}" alt="">
          </a>
        </li>
        <li>
          <a href="http://example.com/video/1">
            <img src="${createFlecktarnUrl('http://example.com/video-thumbnail/1.jpg', config.flecktarn)}" alt="">
          </a>
        </li>
      </ul>
    `)
  })
})
