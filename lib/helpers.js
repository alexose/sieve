var cache = require("memory-cache")
  , crypto = require('crypto');

module.exports = {
  fromCache : function(entry, all){
    var id = this.hash(entry, all)
      , result = cache.get(id);

    return result;
  },
  toCache : function(entry, data, all){

    // TODO: Respect cache headers from response
    var time = (entry.cache || 60 * 60 * 24) * 1000
      , max = 2147483647  // http://stackoverflow.com/questions/3468607
      , key = this.hash(entry, all);

    time = time > max ? max : time;

    cache.put(key, data, time);

    return true;
  },
  hash : function(entry, all){
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
  },
  isArray : function(obj){
    return toString.call(obj) === '[object Array]';
  },
  isObject : function(obj){
    return toString.call(obj) === '[object Object]';
  }
};
