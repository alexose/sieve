// jQuery plugin using Cheerio
// https://github.com/MatthewMueller/cheerio
module.exports = function(corpus, selector, cb){

  var cheerio, $;

  try {
    cheerio = require('cheerio');
  } catch(e){
    throw new Error('jQuery support is not enabled.  Did you run "npm install cheerio"?');
  }

  try {
    $ = cheerio.load(corpus);
  } catch(e){
    throw new Error('jQuery input error: ' + e.toString());
  }

  try {
    var elements = $(selector)
      , arr = [];

    $(selector).each(function(){
        arr.push($(this).text());
    });

    cb(arr.join());
  } catch(e){
    throw new Error('jQuery error: ' + e.toString());
  }
};
