var http = require("http");

var args = process.argv.splice(2),
    port = args[0] || 3000;

http.createServer(function(request, response) {
  
  console.log('Server running on port ' + port);

  response.writeHead(200, {"Content-Type": "text/plain"});
  response.write("Hello World");
  response.end();

}).listen(port);
