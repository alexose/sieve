var http = require('follow-redirects').http
  , https = require('follow-redirects').https
  , url = require('url')
  , qs = require('querystring')
  , helpers = require('./helpers')
  , log = require('./log');

module.exports = function fetch(entry, cb){

  var a = url.parse(entry.url);
  
  // Set up headers
  var headers = {};
  for (var key in entry.headers){
    headers[key] = entry.headers[key];
  }

  // Convert form data to urlstring
  if (entry.form){
    entry.body = qs.stringify(entry.form);
    entry.method = 'POST';
  }

  if (entry.body){
    // Assume these headers
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    headers['Content-Length'] = entry.body.length;
  }

  var settings = {
    host:    a.hostname,
    port:    a.port || 80,
    path:    a.path,
    headers: headers,
    method:  entry.method,
    auth:    a.auth,
    followAllRedirects: true
  };

  var protocol;
  if (a.protocol == 'https:'){
    protocol = https;
    settings.port = 443; // Override secure port always
  } else {
    protocol = http;
  }

  var cookies = [];
  try {
    var request = protocol.request(settings, function(response){

      var code = response.statusCode;

      // Set cookie if it exists
      // We're doing it here so that a redirect can set a cookie.
      // TODO: multiple cookies?
      if (response.headers['set-cookie']){
        cookies.push(response.headers['set-cookie']);
      }

      var result = '';
      response.on('data', function(d){
        result += d;
      });

      response.on('end', function(){
        cb({
          entry:   entry,
          result:  result,
          success: true,
          headers: response.headers,
          cookies: cookies
        });
      }).on("error", function(e){
        log(e, 'error');
      });

      request.setTimeout(2000, function(){
        log('Request timed out.', 'error');
      });

    });

    if (entry.body){
      request.write(entry.body);
    }

    request.end();

  } catch(e){
    log(e, 'error'); 
  }

  return;
};
