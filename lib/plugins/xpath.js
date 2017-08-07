// Default Xpath plugin
module.exports = function(corpus, selector, cb){

  var xpath, jsdom;

  try {
    xpath = require('xpath');
    JSDOM = require('jsdom').JSDOM;
  } catch(e){
    throw new Error('Xpath support is not enabled.  Did you run "npm install xpath jsdom"?');
  }

  try {
    var dom = new JSDOM(corpus);

    // Now that we have a valid document, let's use xpath on it.
    try {

      var result = xpath.select(selector, dom);
      // If the selector ends in "@something", we're extracting values.  Otherwise, just text.
      var value = selector.split('/').pop().indexOf('@') === 0
        , arr = [];

      if (value){
        result.forEach(function(d){
          arr.push(d.value);
        });
      } else {
        result.forEach(function(d){
          arr.push(d.textContent);
        });
      }

      cb(arr);
    } catch(e){
      throw new Error('Xpath plugin: ' + e.toString());
    }

    // Free memory
    dom.window.close();
  } catch(e){
    throw new Error('Xpath error: ' + e.toString());
  }
};
