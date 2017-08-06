// Simple in-memory job queue for use with Sieve.
//
// In its base configuration, jobs are stored in local memory and farmed out to workers.
//
// This can be scaled used Amazon's SQS and Lambda for large installations, 
// or when speed is important.

var PubSub = require('pubsub-js');
var queue = [];
var simultaneous = 1;
var active = 0;
var wait = 200;
var count = 0;

// Add an entry to the job queue
function add(entry){
  count += 1;
  queue.push({
    count: count,
    entry: entry
  });
  update();
  return count; 
}

// Check to see if we have work to do
function update(){
  if (queue.length && active < simultaneous){
    active += 1;
    var last = queue.shift();
    console.log('processing ' + JSON.stringify(last));
    setTimeout(function done(){
      PubSub.publish('result.' + last.count, 'hello');
      active -= 1;
      update();
    }, wait);
  }
}

module.exports = {
  add: add
}
