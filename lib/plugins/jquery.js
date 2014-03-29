// jQuery plugin using Cheerio
// https://github.com/MatthewMueller/cheerio
module.exports = function(corpus, selector, cb){
  var cheerio = require('cheerio')
    , $;

  try {
    $ = cheerio.load(corpus);
  } catch(e){
    throw new Error('jQuery input error:' + e.toString());
  }
  try {
    var str = $(selector).text();

    cb(str);
  } catch(e){
    throw new Error('jQuery error:' + e.toString());
  }
};
