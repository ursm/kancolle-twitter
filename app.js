const ntwitter = require('ntwitter');
const request  = require('request');

const [consumer_key, consumer_secret, access_token_key, access_token_secret] = process.env.TWITTER_AUTH.split(':');
const endpoint                                                               = process.env.HOOK_ENDPOINT;

const twitter = new ntwitter({consumer_key, consumer_secret, access_token_key, access_token_secret});

function notify({user: {name, screen_name, profile_image_url_https}, text, extended_tweet, id_str}) {
  // TODO name をエスケープ data.text はすでにエスケープ済み

  if (extended_tweet) {
    text = extended_tweet.full_text;
  }

  const source = `
<img height="16" width="16" src="${profile_image_url_https}">
<b>${name}</b> (<a href="https://twitter.com/${screen_name}">@${screen_name}</a>)<br>
<p>${text} (<a href="https://twitter.com/${screen_name}/status/${id_str}">show</a>)</p>
  `.trim();

  request.post(endpoint, {
    form: {
      source,
      format: 'html'
    }
  }, () => {
    // do nothing...
  });
}

const kancolleStaffID = '294025417';

twitter.stream('statuses/filter', {follow: kancolleStaffID, tweet_mode: 'extended'}, (stream) => {
  stream.on('data', (data) => {
    if (data.retweeted_status) { return; }

    switch (data.in_reply_to_user_id_str) {
      case null:
      case undefined:
      case kancolleStaffID:
        notify(data);
      default:
        // do nothing
    }

  });

  stream.on('error', (error, data) => {
    console.log(error, data);
  });
});
