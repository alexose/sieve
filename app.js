var http = require("http")
  , https = require("https")
  , url = require("url")
  , fs = require("fs")
  , querystring = require("querystring")
  , Sieve = require("./lib/sieve");

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
