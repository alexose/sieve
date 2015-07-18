var template = require('./lib/template')
  , validate = require('./lib/validate')
  , select   = require('./lib/select')
  , fetch    = require('./lib/fetch')
  , replace  = require('./lib/replace')
  , helpers  = require('./lib/helpers');

module.exports = Sieve = function init(data, options){

  this.data    = data;
  this.options = options;

  try {
    this.init();
  } catch(e){
    this.error(e);
    return;
  }

  this.run();

  return this;
};

Sieve.prototype.defaults = {
  headers: { "User-Agent": "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.0; Trident/4.0)" },
  port:    80,
  timeout: 10,
  method:  'GET',
  wait:    1, // Delay between scheduling batch requests
  tries:   3, // Maximum number of attempts per url
  cache:   60 * 60 * 24
};

Sieve.prototype.init = function(){

  this.options = helpers.extend(
    {},
    this.defaults,
    this.options
  );

  return this;
};

// The main access point into Sieve.  Input can be a single entry or an array of entries.
Sieve.prototype.get = function(entry, index, container){

  if (helpers.isArray(entry)){

    // Create an empty array of equal length to the entry
    var results = new Array(entry.length);

    entry.forEach(function(d, i){
      this.get(entry, i, results);
    });

    return this;
  }

  var process = this.process.bind(this)
    , finish = this.finish.bind(this);

  fetch(entry, this.options, function accumulate(obj){

    // Process raw results
    process(obj, function(result){

      if (container){

        container[index] = result;

        // If the container is full, then we're done!
        if (container.indexOf(undefined) === -1){
          finish(container);
        }
      } else {
        finish(result);
      }
    });

  }); 
};

// Given successful results, do things with them
Sieve.prototype.process = function(obj, cb){

  if (obj.success){

    // Run results through selector engine
    if (entry.selector){
      try {
        select(obj, replace);
      } catch(e){

        // Provide selector error message as feedback
        result = 'ERROR: ' + e.toString();
        process(replace);
      }
    } else {
      replace(obj);
    }
  } else {
    cb(obj);
  }

  // Experimental "replace" feature
  function replace(obj){

    if (entry.replace){
      // obj = replace(obj, entry.replace);
    }

    then(obj);
  }

  // Handle "then" request
  function then(obj){

    var entry = obj.entry;

    if (entry.then){

      if (!entry.then.url){
        throw new Error('Specified a "then" command, but didn\'t provide a URL.');
      }

      // If our selector engine returned an object, it's templating time!
      if (helpers.isObject(entry.result)){
        entry.then.data = result;
      }

      // Experimental response header support
      if (entry.options.useHeaders){
        helpers.extend(entry.result, obj.headers)
      }

      // Experimental cookie support
      if (obj.cookie){
        if (!entry.then.headers){
          entry.then.headers = {};
        }

        entry.then.headers['Cookie'] = obj.cookie;
      }

      // Set options for sub-sieve
      var options = helpers.extend(true, {}, this.options);

      // Run sub-sieve
      (new Sieve(options)).get(entry.then).bind('finish', function(evt, result){
        cb(result);
      });

    } else {
      cb(result);
    }
  }
};

// Finish the request and send it back
Sieve.prototype.finish = function(result){
  console.log('done');

  // TODO: emit event
}

Sieve.prototype.error = function(e){

  var type = typeof(e)
    , error = this.hooks.onError;

  if (type === 'object'){
    console.log(e.stack);
    error(e.toString());
  } else if (type === 'string'){
    console.log(e);
    error(e);
  } else {
    error('Unknown error.');
  }
};
