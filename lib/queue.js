// Simple in-memory job queue for use with Sieve.
//
// In its base configuration, jobs are stored in local memory and farmed out to workers.
//
// This can be scaled used Amazon's SQS and Lambda for large installations, 
// or when speed is important.

var PubSub = require('pubsub-js');
var config = require('../config.js');
var run = require('./run');
var workers = config.workers;
var wait = config.wait_between_requests || 0;

var queue = [];
var active = 0;
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
  if (queue.length && active < workers){
    active += 1;
    var last = queue.shift();
    run(last);
  }
}

// Listen for finished jobs
PubSub.subscribe('result', function(name, data){
  active -= 1;
  update(); 
});

module.exports = {
  add: add
}
