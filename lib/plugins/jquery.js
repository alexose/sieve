// jQuery plugin using Cheerio
// https://github.com/MatthewMueller/cheerio
module.exports = function(corpus, selector, cb){

  var cheerio = require('cheerio');
  var $ = cheerio.load(corpus);

  // TODO: sandbox this
  var result = eval(selector);

  if (typeof result === 'object'){
    cb(result.html());
  } else {
    cb(result);
  }
};

// Remove quotes and parenthesis
function strip(string){
  return string
      .replace(/(\(|\))/g,'')
      .replace(/(\'|\')/g,'')
      .replace(/(\"|\")/g,'');
}
