var template = require('./lib/template')
  , validate = require('./lib/validate')
  , error    = require('./lib/error')
  , select   = require('./lib/select')
  , fetch    = require('./lib/fetch')
  , hash     = require('./lib/hash')
  , helpers  = require('./lib/helpers');

module.exports = Sieve = function init(data, callback, options){

  this.data = data;
  this.callback = callback;
  this.options = options;

  this
    .init()
    .run();

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
    .initErrors()
    .initOptions()
    .initEntries()
    .initResults();

  return this;
};

Sieve.prototype.initErrors = function(){
  error = error.bind(this);

  return this;
};

Sieve.prototype.initOptions = function(){

  this.options = this.extend({}, this.options, this.defaults);

  return this;
};

Sieve.prototype.initEntries = function(){

  var data = this.data;

  if (!helpers.isObject(data)){

    // Convert string to JSON
    try {
      data = JSON.parse(data);
    } catch(e){
      error('JSON error: ' + e.toString());
    }
  }

  validate(data);

  this.entries = template(data);

  return this;
};

Sieve.prototype.initResults = function(){
  this.results = [];

  this.expected = helpers.isArray(this.entries) ? this.entries.length : 1;

  return this;
};

Sieve.prototype.run = function(entry, pos){

  entry = entry || this.entries;

  var options = this.options;

  if (helpers.isArray(entry)){
    entry.forEach(this.run.bind(this));
  } else {
    this.get(entry, 0, options, this.accumulate.bind(this));
  }

};

Sieve.prototype.get = function(entry, pos, options, cb){

  // See if we already have the request cache
  var result = helpers.fromCache(entry, true);

  if (result){

    if (entry.debug){
      result.cached = 'result';
    }

    cb(entry, result, pos);
  } else {

    // Go fetch!
    fetch(entry, pos, options, cb);
  }

};

Sieve.prototype.accumulate = function (entry, result, pos){

  if (entry.selector){
    select(result, entry.selector, entry.engine, selected.bind(this));
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
        error('Specified a "then" command, but didn\'t provide a template or a URL.');
      }

      // If we have a keyed array, we're going to use templating
      if (helpers.isObject(result)){
        entry.then.data = result;
      }

      new Sieve(JSON.stringify(entry.then), function(results){
        cb(results);
      }, this.options);

    } else {
      cb(result);
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
          arr.forEach(function(d){ delete d.pos; });

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

        this.callback(arr);
      }
    }
  }
};

// Shallow extend helper
Sieve.prototype.extend = function(){

  var args = Array.prototype.slice.call(arguments)
    , obj = args.reverse().pop();

  args.forEach(function(d){
    if (helpers.isObject(d)){
      for (var prop in d){
        if (d.hasOwnProperty(prop)){
         obj[prop] = d[prop];
        }
      }
    }
  }.bind(this));


  return obj;
};
