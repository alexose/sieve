var helpers = require('./helpers');

// Handle formatting-related replacements
module.exports = function(corpus, replacement){

  var prop;

  if (helpers.isObject(replacement)){

    // Operate on a per-property basis
    for (prop in replacement){
      if (corpus[prop]){
        corpus[prop] = replace(corpus[prop], replacement[prop]);
      }
    }
  } else {

    // Replace everything indescriminately.
    // Remember that corpus can be a keyed object or an array, so we need to handle both cases.
    if (helpers.isObject(corpus)){
      for (prop in corpus){
        corpus[prop] = replace(corpus[prop], replacement);
      }
    } else {
      corpus = replace(corpus, replacement);
    }
  }

  return corpus;

  function replace(haystack, needle){

    // The "needle" can either be nested or non-nested array.
    // e.g. ['replace', 'me'] or [['replace', 'me'], ['and replace', 'me too']];
    if (helpers.isArray(needle[0])){

    } else {

      var match = needle[0]
        , substitute = needle[1];

      for (var i in haystack){
        haystack[i] = haystack[i].replace(match, substitute);
      }
    }

    return haystack;
  }
};

