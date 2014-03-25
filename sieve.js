var template = require('./lib/template')
  , validate = require('./lib/validate')
  , select   = require('./lib/select')
  , fetch    = require('./lib/fetch')
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

  this
    .initOptions()
    .initHooks()
    .initEntries()
    .initResults();

  return this;
};

Sieve.prototype.initOptions = function(){

  this.options = helpers.extend(
      {},
      this.defaults,
      this.options
    );

  return this;
};

Sieve.prototype.initHooks = function(){

  var available = ['onStart', 'onIncrement', 'onFinish']
    , hooks     = this.options.hooks || {}
    , result    = {}
    , noop      = function(){};

  available.forEach(function(d){
    result[d] = hooks[d] || noop;
  });

  this.hooks = result;

  return this;

};

Sieve.prototype.initEntries = function(){

  var data = this.data;

  if (!helpers.isObject(data)){

    // Convert string to JSON
    try {
      data = JSON.parse(data);
    } catch(e){
      throw new Error('JSON error: ' + e.toString());
    }
  }

  validate(data);

  var entries = template(data);

  if (helpers.isArray(entries)){

    if (!this.entries.length){
      this.error("Error: No results.");
    }

    this.entries = entries;
  } else if (helpers.isObject(entries)){
    this.entries = entries;
  } else {
    this.error("Error: No entry.");
  }

  return this;
};

Sieve.prototype.initResults = function(){

  this.results = [];
  this.expected = helpers.isArray(this.entries) ? this.entries.length : 1;

  return this;
};

Sieve.prototype.run = function(entry, pos){

  if (!this.entries){
    return;
  }

  entry = entry || this.entries;

  var options = this.options;

  if (helpers.isArray(entry)){
    entry.forEach(this.run.bind(this));
  } else {
    this.get(entry, 0);
  }
};

Sieve.prototype.get = function(entry, pos){

  var hash = helpers.hash(entry);

  this.hooks.onStart({
    hash : helpers.hash(entry)
  });

  // See if we already have the request cache
  var result = helpers.fromCache(entry, true);

  if (result){

    if (entry.debug){
      result.cached = 'result';
    }

    this.hooks.onFinish(result);
  } else {

    // Go fetch!
    fetch(entry, pos, this.options, this.accumulate.bind(this));
  }
};

Sieve.prototype.accumulate = function (entry, result, pos){

  if (entry.selector){
    try {
      select(result, entry.selector, entry.engine, selected.bind(this));
    } catch(e){
      this.error(e);
    }
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
        throw new Error('Specified a "then" command, but didn\'t provide a template or a URL.');
      }

      // If we have a keyed array, we're going to use templating
      if (helpers.isObject(result)){
        entry.then.data = result;
      }

      // Define behaviors for sub-sieve
      var options = helpers.extend(true, {}, this.options);
      options.hooks.onFinish = cb;

      // Prevent onIncrement.  Recursion here would mean re-printing the data at each level.  No good!
      this.options.hooks.onIncrement = function(){};

      new Sieve(JSON.stringify(entry.then), options);

    } else {
      cb(result);
    }

    // Add result to array
    function add(result){

      var obj = {
        result : result,
        entry : entry,
        pos : pos
      };

      var increment = this.hooks.onIncrement;

      if (entry.debug){
        increment(obj);
      } else if (result) {

        // Supress empty results
        var response = {}
          , lastprop
          , props = 0;
        if (helpers.isObject(result)){
          for (var prop in result){
            if (result[prop].length){
              response[prop] = result[prop];
              lastprop = prop;
              props++;
            }
          }
        } else {
          props++;
        }

        if (props == 1 && lastprop){
          increment(result[lastprop]);
        } else if (props > 0){
          increment(result);
        }
      }

      arr.push(obj);

      if (typeof(pos) === 'number'){

        // Check to see if we've accumulated all the results we need
        if (arr.length === this.expected){

          // Re-order results array to match original request
          arr.sort(function(a, b){
            return a.pos > b.pos ? 1 : -1;
          });

          if (!entry.debug){
            arr = arr.map(function(d){ return d.result; });
          }

          finish.call(this, arr);
        }

      } else {

        // If pos is not a number, then we're dealing with a single request.
        delete arr[0].pos;

        finish.call(this, arr[0]);
      }

      function finish(arr){

        // Store results in cache
        helpers.toCache(entry, arr, true);

        this.hooks.onFinish(arr);
      }
    }
  }
};

Sieve.prototype.error = function(e){

  var type = typeof(e)
    , finish = this.hooks.onFinish;

  if (type === 'object'){
    console.log(e.stack);
    finish(e.toString());
  } else if (type === 'string'){
    console.log(e);
    finish(e);
  } else {
    finish('Unknown error.');
  }
};
