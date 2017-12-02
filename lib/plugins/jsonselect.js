// JSONSelect plugin
module.exports = function(corpus, selector, cb){
  
  var engine  = require('JSONSelect');
  var command = 'match';

  try {
    json = JSON.parse(corpus);
    cb(engine[command](selector, json));
  } catch(e){
    cb({
      error: e.toString(),
      response: corpus
    });
  }
};
