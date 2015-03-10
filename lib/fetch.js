var http = require('http')
  , https = require('https')
  , url = require('url')
  , qs = require('querystring')
  , helpers = require('./helpers')
  , cache = require('memory-cache');

module.exports = function get(entry, pos, options, cb){

  // See if we already have the request cached
  var result = helpers.fromCache(entry);
  if (result){
    cb(entry, result, pos);
  } else {

    // Stagger requests according to "wait" param
    var wait = (entry.wait || options.wait) * 1000 * pos;

    setTimeout(fetch, wait);
  }

  function fetch(tries){

    tries = tries || 0;

    if (tries > options.tries){
      error('Tried ' + options.tries + ' times, but got no response.  It\'s possible that we\'re stuck in a redirect loop, or are being blocked.');
      return;
    }

    var a;
    try {
      a = url.parse(entry.url);
    } catch(e){
      error('URL Error: ' + e.toString());
      return;
    }

    // Override default headers with user-specified headers
    // TODO: Unify these options
    var headers = JSON.parse(JSON.stringify(options.headers));
    // Set up headers
    for (var key in entry.headers){
      headers[key] = entry.headers[key];
    }

    // Convert form data to urlstring
    var body = entry.body;
    if (entry.form){
      body = qs.stringify(entry.form);
    }
    if (body){

      // Assume these headers
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
      headers['Content-Length'] = body.length;
    }

    var settings = {
      host:    a.hostname,
      port:    a.port || options.port || 80,
      path:    a.path,
      headers: headers,
      method:  entry.method || options.method,
      auth:    a.auth
    };

    var protocol;
    if (a.protocol == 'https:'){
      protocol = https;
      settings.port = 443; // Override secure port always
    } else {
      protocol = http;
    }

    if (options.verbose){
      console.log(settings.method + 'ing ' + entry.url);
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

        // Handle redirects
        if ((code == 301 || code == 302) && entry.redirect !== false){
          var newURL = response.headers.location;

          if (newURL && newURL !== ''){

            if (newURL.substr(0,1) === '/'){
              newURL = a.protocol + '//' + a.hostname + newURL;
            }

            entry.url = newURL;

            // TODO: this is a little sketch too
            if (entry.method && entry.method.toUpperCase() === 'POST'){
              entry.method = 'GET';
            }

            if (cookie){
                if (!entry.headers){
                    entry.headers = {};
                }
                entry.headers['Cookie'] = cookie;
            }

            fetch(tries+=1);
            return;
          } else {
            error('Got a redirect, but couldn\'t find a URL to redirect to');
          }
        }

        var result = '';
        response.on('data', function(d){
          result += d;
        });

        response.on('end', function(){

          if (result === ''){

            // Try again after specified wait time
            setTimeout(function(){
              fetch(tries+=1);
            }, (entry.wait || options.wait) * 1000);

          } else {
            helpers.toCache(entry, result);
            cb(entry, result, response.headers, cookie, pos);
          }
        }).on("error", function(e){
          error(e);
        });

        request.setTimeout(options.timeout * 1000, function(){
          error('Request timed out.');
        });

      });

      if (body){
        request.write(body);
      }

      request.end();

    } catch(e){
      error(e);
    }

    return;
  }

  function error(e){
    var string = typeof(e) === 'string' ? e : e.toString();

      cb(entry, string, pos);
  }
};
