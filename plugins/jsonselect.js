// JSONSelect plugin
module.exports = function(corpus, selector, cb){
  var engine = require('JSONSelect')
    , command = 'match';

  try {
    var json = JSON.parse(corpus);
  } catch(e){
    this.error('JSONSelect error:' + e.toString());
  }
  try {
    cb(engine[command](selector, json));
  } catch(e){
    this.error('JSONSelect error:' + e.toString());
  }
}
