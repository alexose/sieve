// Default Xpath plugin
module.exports = function(corpus, selector, cb){

  var xpath, jsdom;

  try {
    xpath = require('xpath')
    jsdom = require('jsdom');
  } catch(e){
    throw new Error('Xpath support is not enabled.  Did you run "npm install xpath jsdom"?');
  }

  jsdom.env(corpus, function(errors, window){

    // Now that we have a valid document, let's use xpath on it.
    try {

      var result = xpath.select(selector, window.document);

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
    window.close();
  }.bind(this));
};
