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

    // Sieve encourages selectors to look something like this: $('span.class').text();
    if (selector.substr(0,1) !== '$'){
      throw new Error('jQuery error: First character isn\'t "$".  Did you format your request correctly?');
    }

    selector = selector.substring(1);

    var groups = selector.match(/\([^()]*\)/g);
    var target = strip(groups[0]);

    for (var i in groups){
      selector = selector.replace(groups[i], '');
    }

    groups.shift();

    var method = selector.split('.')[1] || 'text';
    var attrs;
    if (method === 'attr'){
      attrs = strip(groups.join(' '));
    }

    var elements = $(target)
      , arr = [];

    //console.log(target, method, attrs);

    elements.each(function(){
        arr.push($(this)[method](attrs));
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
