var cache = require("memory-cache");

module.exports = {
  fromCache : function(entry, all){
    var id = this.hash(entry, all)
      , result = cache.get(id);
  },
  toCache : function(entry, data, all){

    // TODO: Respect cache headers from response
    var time = (entry.cache || 60 * 60 * 24) * 1000
      , max = 2147483647  // http://stackoverflow.com/questions/3468607
      , key = hash(entry, all);

    time = time > max ? max : time;

    cache.put(key, data, time);

    return true;
  },
  isArray : function(obj){
    return toString.call(obj) === '[object Array]';
  },
  isObject : function(obj){
    return toString.call(obj) === '[object Object]';
  }
};
