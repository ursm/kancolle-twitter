import Handlebars from 'handlebars';
import Sentry from '@sentry/node';
import Twit from 'twit';
import fetch from 'node-fetch';

Sentry.init();

const template = Handlebars.compile(`
  <img height="16" width="16" src="{{user.profile_image_url_https}}">
  <b>{{user.name}}</b> (<a href="https://twitter.com/{{user.screen_name}}">@{{user.screen_name}}</a>)<br>
  <p>{{{text}}} (<a href="https://twitter.com/{{user.screen_name}}/status/{{id}}">link</a>)</p>
`);

const twitter = new Twit({
  consumer_key:        process.env.TWITTER_CONSUMER_KEY,
  consumer_secret:     process.env.TWITTER_CONSUMER_SECRET,
  access_token:        process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

const kancolleStaffID = 294025417;

const stream = twitter.stream('statuses/filter', {
  follow:     kancolleStaffID.toString(),
  tweet_mode: 'extended'
});

stream.on('tweet', async (tweet) => {
  try {
    if (tweet.user.id !== kancolleStaffID) { return; }

    if (tweet.extended_tweet) {
      tweet.text = tweet.extended_tweet.full_text;
    }

    await fetch(process.env.HOOK_ENDPOINT, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source: template(tweet),
        format: 'html'
      })
    });
  } catch (e) {
    console.error(e);

    Sentry.withScope((scope) => {
      scope.setExtra('tweet', tweet);
      Sentry.captureException(e);
    });
  }
});

stream.on('error', (e) => {
  console.error(e);
  Sentry.captureException(e);
});

for (const event of ['connect', 'connected', 'reconnect']) {
  stream.on(event, () => {
    console.log(event);
  });
}
