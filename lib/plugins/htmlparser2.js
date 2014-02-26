// Xpath plugin with htmlparser2
// TODO: Implement Domutils as well?
module.exports = function(corpus, selector, cb){

  var engine = require('xpath')
    , command = 'select'
    , error = this.error.bind(this)
    , dom
    , htmlparser = require('htmlparser2')
    , handler = new htmlparser.DomHandler(go)
    , parser = new htmlparser.Parser(handler);
  
  // Even though this is a callback, it's actually synchronous
  function go(e, _dom){
    if (e){
      error(e);
    } else {
      dom = _dom;
    }
  }
  parser.write(corpus);
  parser.done();

  // Trying jsdom too
  var jsdom = require("jsdom").jsdom;

  var doc = jsdom(corpus);
      
  // Now that we have a valid DOM, let's use xpath on it. 
  try {
    var result = engine[command](selector, doc);
  
    cb(result.toString());
  } catch(e){
    error(e);
  }
}
