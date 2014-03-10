var http = require('http')
  , https = require('https')
  , url = require('url');

var hash = require('./hash')
  , helpers = require('./helpers');

var cache = require('memory-cache');

module.exports = get;

function get(entry, pos, options, cb){

  // See if we already have the request cached
  var result = helpers.fromCache(entry);
  if (result){
    cb(entry, result, pos);
  } else {

    // Stagger requests according to "wait" param
    var wait = (entry.wait || options.wait) * 1000 * pos;

    setTimeout(function(){
      fetch(entry, pos, options, cb);
    }, wait);

  }
}

function fetch(entry, pos, options, cb, tries){

  tries = tries || 0;

  if (tries > options.tries){
    error('Tried ' + options.tries + ' times, but got no response.  It\'s possible that we\'re stuck in a redirect loop, or are being blocked.');
    return;
  }

  var a;
  try {
    a = url.parse(entry.url);
  } catch(e){
    error('No URL specified.');
    return;
  }

  // Override default headers with user-specified headers
  // TODO: Unify these options
  var headers = JSON.parse(JSON.stringify(options.headers));

  for (var key in entry.headers){
    headers[key] = entry.headers[key];
  }

  var secure = a.protocol == 'https:';

  var settings = {
    host : a.hostname,
    port : a.port || (secure ? 443 : 80),
    path : a.path,
    headers : headers,
    method : entry.method || options.method,
    auth : a.auth
  };

  var method = secure ? https : http;

  if (options.verbose){
    console.log('Fetching ' + entry.url);
  }

  try {
    var request = method.request(settings, function(response){

      var code = response.statusCode;

      // Handle redirects
      if (code == 301 || code == 302){
        var newURL = response.headers.location;

        if (newURL && newURL !== ''){
          entry.url = newURL;
          fetch(entry, pos, options, cb, tries+=1);
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
            fetch(entry, pos, options, cb, tries+=1);
          }, (entry.wait || options.wait) * 1000);

        } else {
          helpers.toCache(entry, result);
          cb(entry, result, pos);
        }
      }).on("error", function(e){
        error(e);
      });

      request.setTimeout(options.timeout * 1000, function(){
        error('Request timed out.');
      });

    });

    request.end();

  } catch(e){
    error(e);
  }

  return;
}
