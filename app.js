var http = require("http")
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
  } 

  explain(request, response);

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

  // TODO: Create account for IP?
  this.json = this.parse(data);

  this.json.urls.forEach(this.fetch.bind(this));
  
  response.writeHead(200, {"Content-Type": "text/plain"});
  response.write(json);
  response.end();
};

Sieve.prototype.parse = function(data){
  console.log(data);
  try {
    return JSON.parse(data);
  } catch(e){
    this.error(e);
  }
}

Sieve.prototype.fetch = function(url){
  console.log(url);
}

Sieve.prototype.error = function(error){
  var response = this.response;

  response.writeHead(500, {"Content-Type": "text/plain"});
  response.write(error.toString());
  response.end();
}
