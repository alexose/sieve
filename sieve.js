var PubSub = require('pubsub-js');

var template = require('./lib/template')
  , helpers  = require('./lib/helpers')
  , queue    = require('./lib/queue');

var defaults = {
  headers: { "User-Agent": "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.0; Trident/4.0)" },
  timeout: 10,
  method:  'GET',
  wait:    1, // Delay between scheduling batch requests
  tries:   3, // Maximum number of attempts per url
  cache:   60 * 60 * 24
};

// The main access point into Sieve
module.exports = function sieve(_entry, options){

  var entry = JSON.parse(JSON.stringify(_entry));

  if (typeof options === 'function'){
    options = { onFinish: options }
  } else if (typeof options === 'undefined'){
    options = {};
  }
  
  // Template data if necessary 
  if (entry.data && typeof entry.data === 'object') {
    entry = template(entry, entry.data);
  }

  // Input can be a single entry or an array of entries
  if (helpers.isArray(entry)){

    var expected = entry.length;
    var results = new Array(expected);
    var pos = 0;

    entry.forEach(function(d,i){
  
      d = helpers.extend({}, defaults, d);
      var count = queue.add(d, options);

      // Listen for results
      PubSub.subscribe('result.' + count, function check(msg, data){
        results[i] = data;
        pos += 1;
        if (pos === expected){
          finish(entry, options, results);
        }
      });
    });

  } else {
    entry = helpers.extend({}, defaults, entry);
    var hash = queue.add(entry, options);
    PubSub.subscribe('result.' + hash, function check(msg,data){
      finish(entry, options, data);
    });
  }
};

function finish(entry, options, results){
  if (options.onFinish && !entry.then) {
    options.onFinish(results.result, results.response);
  }
}
