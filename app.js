var http = require("http")
  , https = require("https")
  , url = require("url")
  , fs = require("fs")
  , querystring = require("querystring");

var port = process.argv && process.argv.length > 2 ? process.argv[2] : 3008;

http.createServer(function(request, response) {

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
      new Sieve(response, data);
    });
  } else { 
    explain(request, response);
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

Sieve = function(response, data){

  this.response = response;
  
  // TODO: Authentication
  this.json = this.parse(data);

  var arr = this.json;

  // TODO: Something more clever than forEach
  var results = []; 
  arr.forEach(
    this.fetch.bind(this, accumulate)
  );
 
  function accumulate(result, pos){

    // Add result to array
    results.push([result, pos]);
    
    // Check to see if we've accumulated all the results we need
    if (results.length === arr.length){

      var string = JSON.stringify(results);

      response.writeHead(200, {"Content-Type": "text/plain"});
      response.write(string);
      response.end();
    }
  }
};

Sieve.prototype.defaults = {
  headers : {
    "User-Agent" : "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.0; Trident/4.0)"
  }
}

Sieve.prototype.parse = function(data){
  try {
    var json = JSON.parse(data);

    if (this.validate(json)){
      return json;
    }

    return JSON.parse(data);
  } catch(e){
    this.error(e);
  }
}

Sieve.prototype.validate = function(json){

  if (!json.length){
    throw new Error('No URLs given.');
  }

  return json;
}

Sieve.prototype.fetch = function(cb, entry, pos){
  
  var a = url.parse(entry.url);

  // Override default headers with user-specified headers
  var headers = JSON.parse(JSON.stringify(this.defaults.headers));

  for (var key in entry.headers){
    headers[key] = entry.headers[key]; 
  }

  var options = {
    host : a.hostname,
    port : a.port,
    path : a.pathname,
    headers : headers 
  };

  var method = a.protocol == "https:" ? https : http; 

  try {
    var req = method.request(options, function(response){
      var data = '';
      response.on('data', function(d){
        data += d;
      });

      response.on('end', function(){
        cb(data, pos); 
      });
    }).on("error", function(e){
      throw e; 
    });

  req.end();

  } catch(e){
    this.error(e);
  }

  return;
};

Sieve.prototype.error = function(error){
  var response = this.response;

  response.writeHead(500, {"Content-Type": "text/plain"});
  response.write(error.toString());
  response.end();
}
