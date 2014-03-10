var crypto = require('crypto');

module.exports = function hash(entry, all){
  var json;

  if (all){

    // Stringify the entire entry
    json = entry;
  } else {

    // Only stringify the parts of the entry that are relevant to the HTTP request
    json = {
      url : entry.url,
      headers : entry.headers,
      cache : entry.cache
    };

    if (entry.method){
      json.method = entry.method;
    }
  }

  var string = JSON.stringify(json)
    , result = crypto.createHash('md5').update(string).digest('hex')
    , prefix = all ? 'result-' : 'response-';

  return prefix + result;
}

