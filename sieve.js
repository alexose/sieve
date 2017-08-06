var PubSub = require('pubsub-js');

var template = require('./lib/template')
  , validate = require('./lib/validate')
  , select   = require('./lib/select')
  , fetch    = require('./lib/fetch')
  , replace  = require('./lib/replace')
  , helpers  = require('./lib/helpers')
  , queue    = require('./lib/queue');

var defaults = {
  headers: { "User-Agent": "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.0; Trident/4.0)" },
  port:    80,
  timeout: 10,
  method:  'GET',
  wait:    1, // Delay between scheduling batch requests
  tries:   3, // Maximum number of attempts per url
  cache:   60 * 60 * 24
};

// The main access point into Sieve
module.exports = function sieve(entry, callback){
  
  // Input can be a single entry or an array of entries
  if (helpers.isArray(entry)){

    var expected = entry.length;
    var results = new Array(expected);
    var pos = 0;

    entry.forEach(function(d,i){
      var count = queue.add(d);
      
      // Listen for results
      PubSub.subscribe('result.' + count, function check(msg, data){
        results[i] = data;
        pos += 1;
        if (pos === expected){
          callback(results);
        }
      });
    });

  } else {
    var hash = queue.add(entry);
    PubSub.subscribe('result.' + hash, function check(msg,data){
      callback(data);
    });
  }
};
