// Regex plugin
module.exports = function(corpus, selector, cb){

  try {

    // Parse flags
    var arr   = selector.split('/')
      , flags = arr.pop();

    arr.shift();

    var core = arr.join('/');

    //TODO: something faster?
    var regex = new RegExp(core, flags)
      , results = corpus.match(regex);

    cb(results);
  } catch(e){
    throw new Error('Regex error: ' + e.toString());
  }
};
