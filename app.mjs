import Handlebars from 'handlebars';
import Twit from 'twit';
import fetch from 'node-fetch';

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

const userId = Number.parseInt(process.env.TWITTER_USER_ID, 10);

const stream = twitter.stream('statuses/filter', {
  follow:     userId.toString(),
  tweet_mode: 'extended'
});

stream.on('tweet', async (tweet) => {
  if (tweet.user.id !== userId) { return; }

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
});

for (const event of ['connect', 'connected']) {
  stream.on(event, () => {
    console.log(event);
  });
}

stream.on('reconnect', (req, res, interval) => {
  console.log('reconnect', interval);
});

stream.on('disconnect', (msg) => {
  console.log('disconnect', msg);
});

stream.on('error', (e) => {
  console.error(e);
});
