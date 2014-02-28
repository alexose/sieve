// Attempt to apply selector(s)
module.exports = function(corpus, selector, name, cb){

  if (typeof(selector) === "object"){
    
    var results = {}
      , expected = (Object.keys(selector).length);

    for (var key in selector){
      if (selector.hasOwnProperty(key)){
        select.call(this, corpus, selector[key], name, accumulate.bind(this, key));
      }
    }
  

    function accumulate(key, result){
      results[key] = result;

      if (Object.keys(results).length === expected){
        cb(results);
      }
    }
  } else {
    select.call(this, corpus, selector, name, cb);
  }

  function select(corpus, selector, name, cb){
    try {

      // Assume jsonselect unless otherwise specified
      var engine = require('./plugins/' + (name || 'jsonselect'));
    } catch(e){
      error(e);
    }

    try{
      engine.call(this, corpus, selector, cb);
    } catch(e){
      error(e);
    }
  }
}

