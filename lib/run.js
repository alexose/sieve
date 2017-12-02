// Process an entry
var PubSub = require('pubsub-js');
var fetch = require('./fetch');
var select = require('./select');
var log = require('./log');

module.exports = function run(job){
  var entry = job.entry;
  log('processing ' + JSON.stringify(entry));
  fetch(entry, function(response){
    var selector = entry.selector;
    var engine = entry.engine;

		// Process selector
		if (selector){
      select(response.result, selector, engine, selected);
		} else {
			selected.call(this, response);
		}

    // Post-select logic
    function selected(result){
      PubSub.publish('result.' + job.count, result);
    }
	});
}
