// JSONSelect plugin
module.exports = function(corpus, selector, cb){

  var engine, command, json;

  try {
    engine  = require('JSONSelect');
    command = 'match';
  } catch(e){
      console.log(e);
    throw new Error('JSONSelect support is not enabled.  Did you run "npm install JSONSelect"?');
  }

  try {
    json = JSON.parse(corpus);
  } catch(e){
    throw new Error('JSONSelect input error: ' + e.toString());
  }

  try {
    cb(engine[command](selector, json));
  } catch(e){
    throw new Error('JSONSelect error: ' + e.toString());
  }
};
