var http = require("http")
  , fs = require("fs")
  , querystring = require("querystring");

var port = process.argv && process.argv.length > 2 ? process.argv[2] : 3008;

http.createServer(function(request, response) {

  var data = '';
  if (request.url === '/'){
    explain(request, response);
  } else if (request.method == 'POST'){

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

    // Assume params are urlencoded
    go(request, response, data);

    console.log(data);

    response.writeHead(405, {'Content-Type': 'text/plain'});
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

// Main sieve-ing logic
function go(request, response, json){

  response.writeHead(200, {"Content-Type": "text/plain"});
  response.write(json);
  response.end();
}
