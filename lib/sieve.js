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

    var fetch = this.get.bind(this);

    // TODO: Something more clever than forEach
    if (json.length){
      json.forEach(fetch);
    } else {
      fetch(json, false);
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

  var arr = json;

  // We might be reading arrays or single entries at this point.  Let's validate both:
  if (toString.call(json) !== '[object Array]'){
    arr = [json];

    var single = true;
  }

  arr.forEach(function(d, i){
    if (!d.url){
      var string = 'No URL given';

      throw new Error(single ? string + '.' : string + ' in entry ' + i + '.');
    }
  });

  return true; 
}

Sieve.prototype.get = function(entry, pos){

  // See if we have the request cached, otherwise call fetch
  var cacheKey = this.makeHash(entry);

  var result = cache.get(cacheKey);

  if (result){
    this.accumulate(entry, result, pos);
  } else {
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

// Attempt to apply selector(s)
Sieve.prototype.select = function(corpus, selector, name, cb){

  if (typeof(selector) === "object"){
    
    var results = {};
    for (var key in selector){
      if (selector.hasOwnProperty(key)){
        select(corpus, selector[key], name, accumulate.bind(this, key));
      }
    }

    cb(results);

    function accumulate(key, result){
      results[key] = result;
    }
  } else {
    select.call(this, corpus, selector, name, cb);
  }

  function select(corpus, selector, name, cb){
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
}

Sieve.prototype.accumulate = function (entry, result, pos){

  if (entry.selector){
     result = this.select(result, entry.selector, entry.engine, selected.bind(this));
  } else {
    selected.call(this, result);
  }

  function selected(result){

    var arr = this.results
      , entries;

    if (toString.call(result) === '[object Array]'){
      entries = result.map(then.bind(this));
        
      new Sieve(JSON.stringify(entries), function(results){
        cb(results);
      });
    } else {
      entries = then.call(this, result);

      add.call(this, result);
    }

    // Run "then" instructions
    function then(d){

      if (entry.then){

        // TODO: Better cloning
        var next = JSON.parse(JSON.stringify(entry.then));
      
        next.selection = d;
        next.url = this.template(next.url, d);

        return next;
      } else {
        return d;
      }
    }
  
    // Add result to array
    function add(result){

      var obj = {
        result : result,
        selection : entry.selection,
        pos : pos
      };

      arr.push(obj);
      
      if (typeof(pos) === 'number'){
        
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

      } else {
        
        // If pos is not a number, then we're dealing with a single request.
        delete arr[0].pos;

        this.callback(arr[0]);
      }
    }
  }

};

Sieve.prototype.template = function(template, data){

  var sets = this.makeSets(data);

  var results = sets.map(function(d){
    var string = template;
    Object.keys(d).forEach(function(key){
      string = string.replace('{{' + key + '}}', d[key]);  
    });

    return string;
  });

  console.log(results);

  return results;
}

// Given arrays of data, let's try to match them into sets.
// (Most likely nobody will rely on this, but let's try)
Sieve.prototype.makeSets = function(data){
  
  var sets = []
    , limit = 5000;

  for (var i=0; i<limit; i++){
    var set = {}
      , exit = false;

    Object.keys(data).forEach(function(key){
      var value = data[key][i];

      if (typeof(value) === 'undefined'){
        exit = true;
      } else {
        set[key] = value;
      }

    });

    if (exit){
      break;
    } else {
      sets.push(set);
    }
  }

  return sets;
}

Sieve.prototype.error = function(error){

  console.trace();

  var type = typeof(error);

  if (type === 'object'){
    this.callback(error.toString());
  } else if (type === 'string'){
    this.callback(error);
  }

}
