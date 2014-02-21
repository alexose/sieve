// Sieve test suite
var http = require("http")
  , https = require("https")
  , url = require("url")
  , fs = require("fs")
  , querystring = require("querystring")
  , Sieve = require("../lib/sieve");

var port = process.argv && process.argv.length > 2 ? process.argv[2] : 24816;

server = http
  .createServer(handler)
  .listen(port, start); 

// Begin running tests
function start(){
  console.log('Test server running on port ' + port + '.');

  var files = require("fs").readdirSync("./tests")
    , success = true;

  // Execute tests one at a time
  (function go(files, pos){
    if (pos < files.length){
      var test = require("./tests/" + files[pos]);
      run(test, go.bind(this, files, pos + 1));
    } else {
      console.log('Tests completed.');
      stop();
    }
  })(files, 0);

  function run(test, callback){
    var string = JSON.stringify(test.json);


    var sieve = new Sieve(string, function(result){
      result = result.result;

      if (result == test.expected){
        console.log(test.name + ' succeeded.'); 
      } else {
        console.log(test.name + ' failed:  Expected "' + test.expected + '" and got "' + result + '".');
        success = false;
      }

      callback(success);
    }, { port : port });
  }
}

// Close server and return results 
function stop(success){
  server.close();

  console.log('Test server closed.');

  process.exit(success ? 0 : 1);
}

// Request handler
function handler(request, response){

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
  
    // Handle successful POST 
    respond(response, 'POST Request');
  } else {

    // Handle GET or other methods
    respond(response, 'GET Request');
  }
}

function respond(response, message){
  response.writeHead(200, { "Content-Type" : 'text' });
  response.write(message);
  response.end();
}
