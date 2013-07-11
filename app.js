var flatiron = require('flatiron'),
    path = require('path'),
    plates = require('plates'),
    app = flatiron.app,
    request = require('request'),
    qs = require('querystring'),
    _ = require('underscore');

var CONSUMER_KEY = process.env.FITBIT_KEY;
var CONSUMER_SECRET = process.env.FITBIT_SECRET;

app.config.file({ file: path.join(__dirname, 'config', 'config.json') });

app.use(flatiron.plugins.http);

app.router.get('/', function () {
  this.res.json({ 'hello': 'world' });
});

var oauth = {
  callback: process.env.AUTH_CALLBACK,
  consumer_key: CONSUMER_KEY,
  consumer_secret: CONSUMER_SECRET
};

app.router.get('/auth', function() {
  var res = this.res;
  var url = 'https://api.fitbit.com/oauth/request_token';

  request.post({url:url, oauth:oauth}, function (e, r, body) {

    var access_token = qs.parse(body);

    oauth = {
      consumer_key: CONSUMER_KEY,
      consumer_secret: CONSUMER_SECRET,
      token: access_token.oauth_token
    };

    var url = 'https://www.fitbit.com/oauth/authorize?';

    url += 'oauth_token=' + access_token.oauth_token;

    var html = '<a href="/">Connect to Fitbit</a>';

    var data = { "authUrl": url};
    var map = plates.Map();

    map.where('href').is('/').insert('authUrl');

    var output = plates.bind(html, data, map);

    res.end(output);
  });
});

app.router.get('/auth/fitbit', function() {
  var url = 'https://api.fitbit.com/oauth/access_token';
  var res = this.res;

  var access_token = this.req.query;

  oauth = {
    consumer_key: CONSUMER_KEY,
    consumer_secret: CONSUMER_SECRET,
    token: access_token.oauth_token,
    verifier: access_token.oauth_verifier
  };

  request.post({url:url, oauth:oauth}, function (e, r, body) {

    var perm_token = qs.parse(body);

    oauth = {
      consumer_key: CONSUMER_KEY,
      consumer_secret: CONSUMER_SECRET,
      token: perm_token.oauth_token,
      token_secret: perm_token.oauth_token_secret
    };

    url = 'http://api.fitbit.com/1/user/-/activities/steps/date/today/7d.json';
    request.get({url:url, oauth:oauth, json:true}, function (e, r, user) {
      res.end(JSON.stringify(user));
    });
  });
});

app.router.get('/fitbit', function() {
  var res = this.res;
  var url = 'http://api.fitbit.com/1/user/-/activities/steps/date/today/7d.json';
  request.get({url:url, oauth:oauth, json:true}, function (e, r, data) {
    var steps = _.map(data['activities-steps'], function(ob, key) {
      return {title: ob.dateTime, value: ob.value};
    });

    var response = {
      graph: {
        title: "Fitbit",
        datasequences: [
          {
          title: "Steps",
          datapoints: steps
        }
        ]
      }
    };
    res.end(JSON.stringify(response));
  });
});

app.router.get('/sleep', function() {
  var res = this.res;
  var url = 'http://api.fitbit.com/1/user/-/sleep/minutesAsleep/date/today/7d.json';
  request.get({url:url, oauth:oauth, json:true}, function (e, r, data) {
    var sleep = _.map(data['sleep-minutesAsleep'], function(ob, key) {
      return {title: ob.dateTime, value: Math.round((ob.value / 60) * 100) / 100 };
    });

    var response = {
      graph: {
        title: "Fitbit",
        datasequences: [
          {
          title: "Sleep",
          datapoints: sleep
        }
        ]
      }
    };
    res.end(JSON.stringify(response));
  });

});

app.start(process.env.PORT);
