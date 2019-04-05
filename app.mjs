import Handlebars from 'handlebars';
import Twitter from 'twitter';
import fetch from 'node-fetch';

const [
  consumer_key,
  consumer_secret,
  access_token_key,
  access_token_secret
] = process.env.TWITTER_AUTH.split(':');

const kancolleStaffID = '294025417';

const template = Handlebars.compile(`
  <img height="16" width="16" src="{{user.profile_image_url_https}}">
  <b>{{user.name}}</b> (<a href="https://twitter.com/{{user.screen_name}}">@{{user.screen_name}}</a>)<br>
  <p>{{{text}}} (<a href="https://twitter.com/{{user.screen_name}}/status/{{id_str}}">link</a>)</p>
`);

const twitter = new Twitter({consumer_key, consumer_secret, access_token_key, access_token_secret});
const stream  = twitter.stream('statuses/filter', {follow: kancolleStaffID, tweet_mode: 'extended'});
// const stream  = twitter.stream('statuses/filter', {track: 'javascript', tweet_mode: 'extended'});

stream.on('data', (data) => {
  if (data.retweeted_status) { return; }

  switch (data.in_reply_to_user_id_str) {
    case null:
    case undefined:
    case kancolleStaffID:
      if (data.extended_tweet) {
        data.text = data.extended_tweet.full_text;
      }

      fetch(process.env.HOOK_ENDPOINT, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          source: template(data),
          format: 'html'
        })
      });
    default:
      // do nothing
  }
});

stream.on('error', (error, data) => {
  console.log(error, data);
});
