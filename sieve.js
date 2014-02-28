// Native modules
var http = require('http')
  , https = require('https')
  , url = require('url')
  , crypto = require('crypto');

// Local modules
var template = require('template');

// External dependencies
var cache = require('memory-cache');

module.exports = Sieve = function(data, cb, options){

  this.data = data;
  this.callback = callback;
  this.options = options;

  this.init();

  this.run();

  return this;
}

Sieve.prototype.defaults = {
  headers : {
    "User-Agent" : "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.0; Trident/4.0)"
  },
  port : 80,
  timeout : 10,
  method : 'GET',
  wait : 1, // Delay between scheduling batch requests
  tries : 3, // Maximum number of attempts per url
  cache : 60 * 60 * 24
}

Sieve.prototype.init = function(){

  this
    .initOptions()
    .initRequests();

  return this;
}

Sieve.prototype.initOptions = function(){

  this.options = this.extend({}, options, this.defaults);

  return this;
};

Sieve.prototype.initRequests = function(){

  var data = this.data;

  if (!this.isObject(data)){

    // Convert string to JSON
    try {
      data = JSON.parse(data);
    } catch(e){
      this.error('JSON error: ' + e.toString());
    }
  }

  this.validate(data);

  this.data = template(data);

  return this;
}

// TODO: Better validation feedback
Sieve.prototype.validate = function(json){

  var arr = json;

  // We might be reading arrays or single entries at this point.  Let's validate both:
  if (!this.isArray(json)){
    arr = [json];

    var single = true;
  }

  arr.forEach(function(d, i){
    if (!d.url){
      var string = 'No URL given';

      this.error(single ? string + '.' : string + ' in entry ' + i + '.');
    }
  }.bind(this));
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
      // FIXME: Due to Sieve's recursive nature, this won't work for nested requests
      var wait = (entry.wait || this.options.wait) * 1000 * pos;
     
      setTimeout(function(){
        this.fetch(entry, pos);
      }.bind(this), wait); 
    
    }
  }
}

Sieve.prototype.fetch = function(entry, pos, tries){

  tries = tries || 0;

  if (tries > this.options.tries){
    this.error('Tried ' + this.options.tries + ' times, but got no response.  It\'s possible that we\'re stuck in a redirect loop, or are being blocked.');
    return;
  }

  try {
    var a = url.parse(entry.url);
  } catch(e){
    this.error('No URL specified.');
    return;
  }
        
  // Override default headers with user-specified headers
  // TODO: Unify these options 
  var headers = JSON.parse(JSON.stringify(this.options.headers));

  for (var key in entry.headers){
    headers[key] = entry.headers[key]; 
  }

  var secure = a.protocol == 'https:';

  var options = {
    host : a.hostname,
    port : a.port || (secure ? 443 : 80),
    path : a.path,
    headers : headers,
    method : entry.method || this.options.method,
    auth : a.auth
  };

  var method = secure ? https : http; 

  if (this.options.verbose){
    console.log('Fetching ' + entry.url);
  }

  try {
    var request = method.request(options, function(response){
      
      var code = response.statusCode;

      // Handle redirects 
      if (code == 301 || code == 302){
        var newURL = response.headers.location;

        if (newURL && newURL !== ''){
          entry.url = newURL;
          this.fetch(entry, pos, tries+=1);
          return;
        } else {
          this.error('Got a redirect, but couldn\'t find a URL to redirect to');
        }
      }

      var result = '';
      response.on('data', function(d){
        result += d;
      });

      response.on('end', function(){

        if (result === ''){

          // Try again after specified wait time
          setTimeout(function(){
            this.fetch(entry, pos, tries+=1);
          }.bind(this), (entry.wait || this.options.wait) * 1000);

        } else {
          this.cache.put(entry, result);
          this.accumulate.call(this, entry, result, pos);
        }

      }.bind(this));

    }.bind(this)).on("error", function(e){
      this.error(e);
    }.bind(this));

    request.setTimeout(this.options.timeout * 1000, function(){
      this.error('Request timed out.');
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

      if (entry.method){
        json.method = entry.method;
      }
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
     this.select(result, entry.selector, entry.engine, selected.bind(this));
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
        this.error('Specified a "then" command, but didn\'t provide a template or a URL.');
      }

      // If we have a keyed array, we're going to use templating 
      if (this.isObject(result)){
        entry.then.data = result;
      }

      new Sieve(JSON.stringify(entry.then), function(results){
        cb(results);
      }, this.options);
    
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
        if (arr.length === this.expected){

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

Sieve.prototype.isArray = function(obj){
  return toString.call(obj) === '[object Array]';
}

Sieve.prototype.isObject = function(obj){
  return toString.call(obj) === '[object Object]';
}

// Shallow extend helper
Sieve.prototype.extend = function(){

  var args = Array.prototype.slice.call(arguments)
    , obj = args.reverse().pop();
 
  args.forEach(function(d){
    if (this.isObject(d)){
      for (var prop in d){
        if (d.hasOwnProperty(prop)){
         obj[prop] = d[prop]; 
        }
      }
    }
  }.bind(this));
  

  return obj;
}

Sieve.prototype.error = function(error){

  var type = typeof(error);

  if (type === 'object'){
    console.log(error.stack);
    this.callback(error.toString());
  } else if (type === 'string'){
    this.callback(error);
  }

}
