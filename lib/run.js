// Process an entry
var PubSub = require('pubsub-js');
var fetch = require('./fetch');
var select = require('./select');
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
      if (entry.then){
        var next = JSON.parse(JSON.stringify(entry.then));
        require('../sieve')(next, job.options);
      }
      PubSub.publish('result.' + job.count, result);
    }
	});
}
