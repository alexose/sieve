var http = require("http")
  , https = require("https")
  , url = require("url")
  , fs = require("fs")
  , querystring = require("querystring");

var port = process.argv && process.argv.length > 2 ? process.argv[2] : 3008;

http.createServer(function(request, response) {

  var queries = querystring.parse(request.url.split('?')[1]);

  if (request.method == 'POST'){

    // Prevent overflow
    var data = '';
    request.on('data', function(d) {
      data += d;
      if(data.length > 1e6) {
        data = "";
        response.writeHead(413, {'Content-Type': 'text/plain'}).end();
        request.connection.destroy();
      }
    });
  
    // Handle successful post
    request.on('end', function(){

      // Suport JSONP
      new Sieve(data, finish);

    });
  } else {

    // Support GET base64 failover
    if (queries.json){
      try {

        // via https://groups.google.com/forum/#!topic/nodejs/m6MQDXJNx7w
        var string = new Buffer(queries.json, 'base64').toString('binary') 
      } catch(e){

        //error('Could not convert query from Base64 to string.  Are you sure it\'s encoded properly?');
        error(e.toString());
        return;
      }
      new Sieve(string, finish);
    } else {
      explain(request, response);
    }
  }

  function error(string){
      response.writeHead(200, { "Content-Type" : 'text' });
      response.write(string);
      response.end();
  }
      
  function finish(results){
      
    var string = JSON.stringify(results)
      , type = "text/plain";

    if (queries.callback){
      type = "application/x-javascript"
      string = queries.callback + '(' + string + ')';
    }

    response.writeHead(200, { "Content-Type" : type });
    response.write(string);
    response.end();
  }
}).listen(port, function(){
  console.log('Server running on port ' + port);
});

// Manpage  
function explain(request, response){
  
  fs.readFile('README.md', 'utf8', function (err,data) {
    if (err) {
      return console.log(err);
    }

    response.writeHead(200, {"Content-Type": "text/plain"});
    response.write(data);
    response.end();
  });
}

Sieve = function(data, cb){

  // TODO: Authentication

  this.callback = cb;
  this.results = [];

  this.parse(data, function(json){

    this.urls = json.length;

    var arr = json
      , fetch = this.fetch.bind(this);

    // TODO: Something more clever than forEach
    if (arr && arr.length){
      arr.forEach(fetch);
    }

  }.bind(this));
}

Sieve.prototype.defaults = {
  headers : {
    "User-Agent" : "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.0; Trident/4.0)"
  }
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

Sieve.prototype.fetch = function(entry, pos){
  
  var self = this;

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
        self.accumulate.call(self, entry, result, pos);
      });

    }).on("error", function(e){
      throw e; 
    });

  request.end();

  } catch(e){
    this.error(e);
  }

  return;
};

// Attempt to apply selector
Sieve.prototype.select = function(corpus, selector, engine, cb){

  // Assume jsonselect unless otherwise specified
  engine = engine || 'jsonselect';

  try{
    var result = this.select[engine].call(this, corpus, selector, cb);
  } catch(e){
    this.error(e);
  }
}

// JSONSelect plugin
Sieve.prototype.select.jsonselect = function(corpus, selector, cb){

  var engine = require('JSONSelect')
    , command = 'match';

  try {
    var json = JSON.parse(corpus);
    cb(engine[command](selector, json));
  } catch(e){
    this.error(e);
  }
}

// Default Xpath plugin
Sieve.prototype.select.xpath = function(corpus, selector, cb){

  var engine = require('xpath')
    , command = 'select';

  var jsdom = require('jsdom');

  jsdom.env(corpus, function(errors, window){
  
    // Now that we have a valid document, let's use xpath on it. 
    try {

      var result = engine[command](selector, window.document)

      // If the selector ends in "@something", we're extracting values.  Otherwise, just text.
      var value = selector.split('/').pop().indexOf('@') === 0
        , arr = [];

      console.log(result);
      if (value){
        result.forEach(function(d){
          arr.push(d.value);
        });
      } else {
        result.forEach(function(d){
          arr.push(d.toString());
        });
      }
     
      cb(arr); 
    } catch(e){
      this.error(e);
    }
  }.bind(this));
}

// Xpath plugin with htmlparser2
// TODO: Implement Domutils as well?
Sieve.prototype.select.xpath_htmlparser2 = function(corpus, selector, cb){

  var engine = require('xpath')
    , command = 'select'
    , error = this.error.bind(this)
    , dom
    , htmlparser = require('htmlparser2')
    , handler = new htmlparser.DomHandler(go)
    , parser = new htmlparser.Parser(handler);
  
  // Even though this is a callback, it's actually synchronous
  function go(e, _dom){
    if (e){
      error(e);
    } else {
      dom = _dom;
    }
  }
  parser.write(corpus);
  parser.done();

  // Trying jsdom too
  var jsdom = require("jsdom").jsdom;

  var doc = jsdom(corpus);
      
  // Now that we have a valid DOM, let's use xpath on it. 
  try {
    var result = engine[command](selector, doc);
  
    cb(result.toString());
  } catch(e){
    error(e);
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
