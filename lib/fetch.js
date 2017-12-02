var http = require('http')
  , https = require('https')
  , url = require('url')
  , qs = require('querystring')
  , helpers = require('./helpers');

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
    auth:    a.auth
  };

  var protocol;
  if (a.protocol == 'https:'){
    protocol = https;
    settings.port = 443; // Override secure port always
  } else {
    protocol = http;
  }

  var cookie;
  try {
    var request = protocol.request(settings, function(response){

      var code = response.statusCode;

      // Set cookie if it exists
      // We're doing it here so that a redirect can set a cookie.
      if (response.headers['set-cookie']){
        cookie = response.headers['set-cookie']
      }

      if (code === 302 || code === 301){

        var copy = JSON.parse(JSON.stringify(entry));
        copy.url = response.headers.location;
        fetch(copy, cb);
        return;
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
          cookie:  cookie
        });
      }).on("error", function(e){
        error(e);
      });

      request.setTimeout(2000, function(){
        error('Request timed out.');
      });

    });

    if (entry.body){
      request.write(entry.body);
    }

    request.end();

  } catch(e){
    error(e);
  }

  return;
};
