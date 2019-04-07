import dedent from 'dedent'
import fetch from 'node-fetch'

import createStream from '../stream'
import { createFlecktarnUrl } from '../util'

jest.mock('node-fetch')
jest.mock('twitter-lite')

describe('stream', () => {
  const config = {
    idobata: {
      hookEndpoint: 'https://example.com/idobata-hook'
    },
    twitter: {
      follow: 'FOLLOW_USER_ID'
    },
    flecktarn: {
      url:        'https://example.com/flecktarn',
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
          profile_image_url_https: 'https://example.com/profile.png',
          name: 'Alice Liddell',
          screen_name: 'alice',
        },
        id_str: 'TWEET_ID',
        text: 'hello from the wonderland'
      })

      expect(fetch).toHaveBeenCalledWith('https://example.com/idobata-hook', {
        method: 'post',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          source: dedent`
            <img height="16" width="16" src="https://example.com/profile.png">
            <b>Alice Liddell</b> (<a href="https://twitter.com/alice">@alice</a>)<br>
            <p>hello from the wonderland (<a href="https://twitter.com/alice/status/TWEET_ID">link</a>)</p>
          `,
          format: 'html'
        })
      })
    })

    test('extended', () => {
      const photoUrl     = 'https://example.com/tweet-photo.png'
      const flecktarnUrl = createFlecktarnUrl(photoUrl, config.flecktarn)

      stream.emit('data', {
        user: {
          id_str: 'FOLLOW_USER_ID',
          profile_image_url_https: 'https://example.com/profile.png',
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
              media_url_https: photoUrl
            },
            {
              type: 'other'
            }
          ]
        }
      })

      expect(fetch).toHaveBeenCalledWith('https://example.com/idobata-hook', {
        method: 'post',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          source: dedent`
            <img height="16" width="16" src="https://example.com/profile.png">
            <b>Alice Liddell</b> (<a href="https://twitter.com/alice">@alice</a>)<br>
            <p>Drink Me (<a href="https://twitter.com/alice/status/TWEET_ID">link</a>)</p>

              <ul class="list-inline">
                  <li>
                    <a href="${flecktarnUrl}">
                      <img src="${flecktarnUrl}" alt="">
                    </a>
                  </li>
              </ul>
          `,
          format: 'html'
        })
      })
    })
  })
})