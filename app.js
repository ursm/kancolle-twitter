var ntwitter = require('ntwitter'),
    request  = require('request');

var parts    = process.env.TWITTER_AUTH.split(':'),
    endpoint = process.env.HOOK_ENDPOINT;

var config = {
  consumer_key:        parts[0],
  consumer_secret:     parts[1],
  access_token_key:    parts[2],
  access_token_secret: parts[3]
};

twitter = new ntwitter(config);

function build_source(data) {
  var screen_name = data.user.screen_name;

  // TODO user.name をエスケープ
  // text はすでにエスケープ済み
  var message = '<img height="16" width="16" src="' + data.user.profile_image_url_https + '">';
  message += ' <b>' + data.user.name + '</b>';
  message += ' (<a href="https://twitter.com/' + screen_name + '">@' + screen_name + '</a>)<br>';
  message += '<p>' + data.text;
  message += ' (<a href="https://twitter.com/' + screen_name + '/status/' + data.id_str + '">show</a>)</p>';
  return message;
}

function notify(data) {
  var source = build_source(data);

  request.post(endpoint, {
    form: {
      source: source,
      format: 'html'
    }
  }, function(error, response, body){
    // do nothing...
  });
}

twitter.stream('user', {track: 'hrysd'}, function(stream) {
  stream.on('data', function(data) {
    if (data.user) {
      if (['KanColle_STAFF', 'kancollect'].indexOf(data.user.screen_name) != -1) {
        notify(data);
      }
    }
  });

  stream.on('error', function(error, data) {
    console.log(error, data);
  });
});
