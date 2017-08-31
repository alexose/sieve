// jQuery plugin using Cheerio
// https://github.com/MatthewMueller/cheerio
module.exports = function(corpus, selector, cb){

  var cheerio, $;

  try {
    cheerio = require('cheerio');
  } catch(e){
    throw new Error('jQuery support is not enabled.');
  }

  try {
    $ = cheerio.load(corpus);
  } catch(e){
    throw new Error('jQuery input error: ' + e.toString());
  }

  try {

    // Sieve encourages selectors to look something like this: $('span.class').text();
    if (selector.substr(0,1) !== '$'){
      throw new Error('jQuery error: First character isn\'t "$".  Did you format your request correctly?');
    }

    var parts = selector.split('!');

    var elements = eval(parts[0]),
        method = parts[1] || ".text()",
        arr = [];

    elements.each(function(){
        arr.push(eval('$(this)' + method));
    });

    cb(arr);
  } catch(e){
    throw new Error('jQuery error: ' + e.toString());
  }
};

// Remove quotes and parenthesis
function strip(string){
  return string
      .replace(/(\(|\))/g,'')
      .replace(/(\'|\')/g,'')
      .replace(/(\"|\")/g,'');
}
