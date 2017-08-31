// Default Xpath plugin
module.exports = function(corpus, selector, cb){

  var libxml;

  try {
    libxml = require('libxmljs-dom');
  } catch(e){
    throw new Error('Xpath support is not enabled.  Did you run "npm install libxml"?');
  }

  try {
    var document = libxml.parseHtml(corpus);
    // Now that we have a valid document, let's use xpath on it.
			try {
        var result = document.find(selector);

        /*
        // If the selector ends in "@something", we're extracting values.  Otherwise, just text.
        var value = selector.split('/').pop().indexOf('@') === 0
          , arr = [];

        if (value){
          result.forEach(function(d){
            arr.push(d.value);
          });
        } else {
          result.forEach(function(d){
            console
            arr.push(d.textContent);
          });
        }

				cb(arr);
        */
        cb(result);
			} catch(e){
				throw new Error('Xpath plugin: ' + e.toString());
			}
  } catch(e){
    throw new Error('Xpath error: ' + e.toString());
  }
};
