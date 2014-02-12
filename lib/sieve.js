var http = require("http")
  , https = require("https")
  , url = require("url")
  , crypto = require('crypto')
  , cache = require("memory-cache");

module.exports = Sieve = function(data, cb){

  // TODO: Authentication

  this.callback = cb;
  this.results = [];

  this.parse(data, function(json){

    this.urls = json.length;

    var arr = json
      , fetch = this.get.bind(this);

    // TODO: Something more clever than forEach
    if (arr && arr.length){
      arr.forEach(fetch);
    }

  }.bind(this));

  return this;
}

Sieve.prototype.defaults = {
  headers : {
    "User-Agent" : "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.0; Trident/4.0)"
  },
  cache : 10
}

Sieve.prototype.parse = function(data, cb){
  try {
    var json = JSON.parse(data);

    if (this.validate(json)){
      cb(json);
    }
  } catch(e){
    this.error(e);
  }
}

Sieve.prototype.validate = function(json){

  if (!json.length){
    throw new Error('No URLs given.');
    return false;
  }

  return true;
}

Sieve.prototype.get = function(entry, pos){

  // See if we have the request cached, otherwise call fetch
  var cacheKey = this.makeHash(entry);

  var result = cache.get(cacheKey);

  if (result){
    this.accumulate(entry, result, pos);
  } else{
    this.fetch(entry, pos);
  }
}

Sieve.prototype.fetch = function(entry, pos){
  
  var a = url.parse(entry.url);
        
  // Prepare cache entry  
  var cacheKey = this.makeHash(entry); 

  // Override default headers with user-specified headers
  var headers = JSON.parse(JSON.stringify(this.defaults.headers));

  for (var key in entry.headers){
    headers[key] = entry.headers[key]; 
  }

  var options = {
    host : a.hostname,
    port : a.port,
    path : a.path,
    headers : headers,
    auth : a.auth
  };

  var method = a.protocol == "https:" ? https : http; 

  try {
    var request = method.request(options, function(response){
      var result = '';
      response.on('data', function(d){
        result += d;
      });

      response.on('end', function(){

        // Write to cache
        // TODO: Respect cache headers from response
        var time = entry.cache || this.defaults.cache;
        cache.put(cacheKey, result, time * 1000); 

        this.accumulate.call(this, entry, result, pos);
      }.bind(this));

    }.bind(this)).on("error", function(e){
      throw e; 
    }.bind(this));

  request.end();

  } catch(e){
    this.error(e);
  }

  return;
};

Sieve.prototype.makeHash = function(entry){
    var cache = entry.cache ? entry.cache : ""
      , string = entry.url + JSON.stringify(entry.headers) + cache
      , hash = crypto.createHash('md5').update(string).digest('hex');

    return 'cache-' + hash;
}

// Attempt to apply selector
Sieve.prototype.select = function(corpus, selector, name, cb){

  try {
    // Assume jsonselect unless otherwise specified
    var engine = require('./plugins/' + (name || 'jsonselect'));
  } catch(e){
    this.error(e);
  }

  try{
    engine.call(this, corpus, selector, cb);
  } catch(e){
    this.error(e);
  }
}

Sieve.prototype.accumulate = function (entry, result, pos){

  if (entry.selector){
     result = this.select(result, entry.selector, entry.engine, selected.bind(this));
  } else {
    selected.call(this, result);
  }

  function selected(result){

    var arr = this.results;

    // Run "then" instruction on each result
    if (entry.then && result && result.length){

      var cb = add.bind(this)
        , entries = [];

      result.forEach(function(d,i){
       
        // TODO: Better cloning
        var then = JSON.parse(JSON.stringify(entry.then));
        
        // TODO: Support $1, $2, etc.
        then.selection = d;
        then.url = then.url.replace('$1', d);

        entries.push(then);
      });
        
      new Sieve(JSON.stringify(entries), function(results){
        cb(results);
      });

    } else {
      add.call(this, result);
    }
  
    // Add result to array
    function add(result){

      var obj = {
        result : result,
        selection : entry.selection,
        pos : pos
      };

      arr.push(obj);
      
      // Check to see if we've accumulated all the results we need
      if (arr.length === this.urls){

        // Re-order results array to match original request
        arr.sort(function(a, b){
          return a.pos > b.pos ? 1 : -1;
        });

        // Remove "pos" attrs
        var results = arr.forEach(function(d){ delete d.pos });
     
        this.callback(arr);
      } 
    }
  }

};


Sieve.prototype.error = function(error){

  console.trace();

  var type = typeof(error);

  if (type === 'object'){
    this.callback(error.toString());
  } else if (type === 'string'){
    this.callback(error);
  }

}
