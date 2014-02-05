var http = require("http")
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

  var urls = this.json.urls;

  // TODO: Something more clever than forEach
  var results = []; 
  urls.forEach(
    this.fetch.bind(this, accumulate)
  );
 
  function accumulate(result, pos){

    // Add result to array
    results.push([result, pos]);
    
    // Check to see if we've accumulated all the results we need
    if (results.length === urls.length){
      response.writeHead(200, {"Content-Type": "text/plain"});
      response.write('yay');
      response.end();
    }
  }
};

Sieve.prototype.parse = function(data){
  try {
    return JSON.parse(data);
  } catch(e){
    this.error(e);
  }
}

Sieve.prototype.fetch = function(cb, string, pos){
  var a = url.parse(string); 

  var options = {
    host : a.hostname,
    port : a.port,
    path : a.pathname
  };

  try {
    var req = http.request(options, function(response){
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
