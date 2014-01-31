var http = require("http")
  , querystring = require("querystring");

var port = process.argv && process.argv.length > 2 ? process.argv[3] : 3008;

http.createServer(function(request, response) {
  
  console.log('Server running on port ' + port);
 
  if (request.method == 'POST'){

    // Prevent overflow
    request.on('data', function(d) {
      data += d;
      if(data.length > 1e6) {
        data = "";
        response.writeHead(413, {'Content-Type': 'text/plain'}).end();
        request.connection.destroy();
      }
    });

    // Handle successful post
    request.on('end', function() {
      data = querystring.parse(data);
      go(request, response, data);
    });

  } else {
    response.writeHead(405, {'Content-Type': 'text/plain'});
    response.end();
  }


  go(request, response);

}).listen(port);

// Manpage  
function explain(response){
  response.writeHead(200, {"Content-Type": "text/plain"});
  response.write("Sieve:  the API for your API.");
  response.end();
}

// Main sieve-ing logic
function go(response, json){

  response.writeHead(200, {"Content-Type": "text/plain"});
  response.write(json);
  response.end();
}

// POST processing and hardening
function post(request, response, callback) {
  var data = "";

  if(typeof(callback) !== 'function'){
    return null;
  }

}
