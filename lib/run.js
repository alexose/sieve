// Process an entry
var PubSub = require('pubsub-js');
var fetch = require('./fetch');
var select = require('./select');
var template = require('./template');
var log = require('./log');

module.exports = function run(job){
  var entry = job.entry;
  log('processing ' + JSON.stringify(entry), 3);

  fetch(entry, function(response){
    var selector = entry.selector;
    var engine = entry.engine;

		// Process selector
		if (selector){
      select(response.result, selector, engine, selected);
		} else {
			selected.call(this, response.result);
		}

    // Post-select logic
    function selected(result){
      if (typeof job.options.onResult === 'function') {
        job.options.onResult(result);
      }
      if (entry.then){
        
        var next = JSON.parse(JSON.stringify(entry.then));

        // Template if needed
        if (entry.selector && typeof entry.selector === 'object') {
          next = template(next, result);
        }

        if (response.cookies && response.cookies.length){

          // Pass cookies to next request
          if (!next.headers){
            next.headers = {};
          }

          var specified = next.headers.cookie ? next.headers.cookie.split('; ') : [];
          var last = entry.headers.cookie ? entry.headers.cookie.split('; ') : [];
          next.headers.cookie = specified.concat(last, response.cookies).join('; ');
        }

        require('../sieve')(next, job.options);
      }
      PubSub.publish('result.' + job.count, result);
    }
	});
}
