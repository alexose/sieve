// JSONSelect plugin
module.exports = function(corpus, selector, cb){
  var engine = require('JSONSelect')
    , command = 'match';

  var json;

  try {
    json = JSON.parse(corpus);
  } catch(e){
    throw new Error('JSONSelect input error:' + e.toString());
  }
  try {
    cb(engine[command](selector, json));
  } catch(e){
    throw new Error('JSONSelect error:' + e.toString());
  }
};
