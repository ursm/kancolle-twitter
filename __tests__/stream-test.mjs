import EventEmitter from 'events'
import Twitter from 'twitter-lite'
import fetch from 'node-fetch'

import createStream from '../stream.mjs'
import { createFlecktarnUrl } from '../util.mjs'

const mockStream = jest.fn().mockImplementation(() => new EventEmitter())

jest.mock('twitter-lite', () => {
  return jest.fn().mockImplementation(() => {
    return {
      stream: mockStream
    }
  })
})

jest.mock('node-fetch')

const config = {
  idobata: {
    hookUrl: 'http://example.com/idobata-hook'
  },
  twitter: {
    followIds: ['FOLLOW_1', 'FOLLOW_2']
  },
  flecktarn: {
    rootUrl:    'http://example.com/flecktarn',
    hmacSecret: 'SECRET'
  }
}

let stream

beforeEach(() => {
  Twitter.mockClear()
  fetch.mockClear()
  mockStream.mockClear()

  stream = createStream(config)
})

test('connect', () => {
  expect(mockStream).toHaveBeenCalledWith('statuses/filter', {follow: 'FOLLOW_1,FOLLOW_2'})
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
        id_str: 'FOLLOW_1',
        profile_image_url_https: 'http://example.com/profile.png',
        name: 'Alice Liddell',
        screen_name: 'alice',
      },
      id_str: 'TWEET_ID',
      text: "hello from\nthe wonderland",
      extended_entities: {
        media: [
          {
            type: 'photo',
            media_url_https: 'http://example.com/photo/1.jpg',
            expanded_url: 'http://example.com/photo/1',
            sizes: {
              medium: {
                w: 1,
                h: 2
              }
            }
          },
          {
            type: 'video',
            media_url_https: 'http://example.com/video-thumbnail/1.jpg',
            expanded_url: 'http://example.com/video/1',
            sizes: {
              medium: {
                w: 3,
                h: 4
              }
            }
          }
        ]
      }
    })

    expect(fetch).toHaveBeenCalledTimes(1)

    const [url, {method, headers, body}] = fetch.mock.calls[0]
    const {source, format} = JSON.parse(body)

    expect(url).toBe('http://example.com/idobata-hook')
    expect(method).toBe('post')
    expect(headers).toEqual({'Content-Type': 'application/json'})
    expect(format).toBe('html')

    expect(source).toMatchSnapshot()
  })

  test('extended', () => {
    stream.emit('data', {
      user: {
        id_str: 'FOLLOW_2',
        profile_image_url_https: 'http://example.com/profile.png',
        name: 'Alice Liddell',
        screen_name: 'alice',
      },
      id_str: 'TWEET_ID',
      text: 'hello from the wonderland',
      extended_tweet: {
        full_text: 'Alice taking "Drink Me" bottle',
        display_text_range: [13, 23],
        extended_entities: {
          media: [
            {
              type: 'photo',
              media_url_https: 'http://example.com/photo/1.jpg',
              expanded_url: 'http://example.com/photo/1',
              sizes: {
                medium: {
                  w: 1,
                  h: 2
                }
              }
            },
            {
              type: 'video',
              media_url_https: 'http://example.com/video-thumbnail/1.jpg',
              expanded_url: 'http://example.com/video/1',
              sizes: {
                medium: {
                  w: 3,
                  h: 4
                }
              }
            }
          ]
        }
      }
    })

    expect(fetch).toHaveBeenCalledTimes(1)

    const [, {body}] = fetch.mock.calls[0]
    const {source} = JSON.parse(body)

    expect(source).toMatchSnapshot()
  })
})

describe('on delete', () => {
  test('ignore', () => {
    stream.emit('data', {
      delete: {
      }
    })

    expect(fetch).not.toHaveBeenCalled()
  })
})
