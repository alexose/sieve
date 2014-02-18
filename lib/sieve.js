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

    var get = this.get.bind(this);
    if (json.length){
      json.forEach(get);
    } else {
      get(json, false);
    }

  }.bind(this));

  return this;
}

Sieve.prototype.defaults = {
  headers : {
    "User-Agent" : "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.0; Trident/4.0)"
  },
  wait : 1, // Delay between scheduling batch requests
  cache : 60 * 60 * 24
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

  // See if we already have this response cached
  var result = this.cache.get(entry, true);
  if (result){

    if (entry.debug){
      result.cached = 'result';
    }

    this.callback(result);
  } else {

    // Now check if we have the request cached
    result = this.cache.get(entry);
    if (result){
      this.accumulate(entry, result, pos);
    } else {

      // Stagger requests according to "wait" param
      var wait = (entry.wait || this.defaults.wait) * 1000 * pos;
      
      setTimeout(function(){
        this.fetch(entry, pos);
      }.bind(this), wait); 
    
    }
  }
}

Sieve.prototype.fetch = function(entry, pos){
  
  var a = url.parse(entry.url);
        
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
        this.cache.put(entry, result);
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

Sieve.prototype.cache = {
  get : function(entry, all){

    var key = this.hash(entry, all)
 
    return cache.get(key);
  },
  put : function(entry, data, all){

      // TODO: Respect cache headers from response
      var time = (entry.cache || 60 * 60 * 24) * 1000
        , max = 2147483647  // http://stackoverflow.com/questions/3468607
        , key = this.hash(entry, all);

      time = time > max ? max : time;

      cache.put(key, data, time); 
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
    }
  
    var string = JSON.stringify(json)
      , hash = crypto.createHash('md5').update(string).digest('hex')
      , prefix = all ? 'result-' : 'response-';

    return prefix + hash;
  }
}

// Attempt to apply selector(s)
Sieve.prototype.select = function(corpus, selector, name, cb){

  if (typeof(selector) === "object"){
    
    var results = {}
      , expected = (Object.keys(selector).length);

    for (var key in selector){
      if (selector.hasOwnProperty(key)){
        select.call(this, corpus, selector[key], name, accumulate.bind(this, key));
      }
    }
  

    function accumulate(key, result){
      results[key] = result;

      if (Object.keys(results).length === expected){
        cb(results);
      }
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
      , cb = add.bind(this);

    if (entry.then){
      
      var url = entry.then.url
        , entries;

      if (!url){
        this.error('Specified a "then" command, but didn\'t provide a URL.');
      }

      // If we have a keyed array, we're going to use templates.
      if (toString.call(result) === '[object Object]'){
        var urls = this.template(url, result);

        entries = urls.map(function(d){;

          // TODO: Better cloning
          var then = JSON.parse(JSON.stringify(entry.then));

          then.url = d;

          return then;  
        });
          
      }

      // Otherwise, we're simply following the URL. 
      else {
        entries = entry.then; 
      }
        
      new Sieve(JSON.stringify(entries), function(results){
        cb(results);
      });
    
    } else {
      cb(result)
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
          arr.forEach(function(d){ delete d.pos });
       
          finish.call(this, arr);
        } 

      } else {
        
        // If pos is not a number, then we're dealing with a single request.
        delete arr[0].pos;

        finish.call(this, arr[0]);
      }

      function finish(arr){

        // Store results in cache
        this.cache.put(entry, arr, true);

        this.callback(arr);
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
