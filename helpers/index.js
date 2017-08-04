// via https://gist.github.com/mikeal/1840641
var net = require('net');
var http = require('http');
var portrange = 8080;

function getPort(cb) {
  var port = portrange;
  portrange += 1;

  var server = net.createServer();
  server.listen(port, function(err){
    server.once('close', function(){
      cb(port);
    })
    server.close();
  })
  server.on('error', function(err){
    getPort(cb);
  })
};

// Set up a simple HTTP server
function serve(data, cb){
	getPort(function(port){
		http.createServer(function(request, response){

      // Handle request
		}).listen(port, function(){
			console.log('Server listening on ' + port);
			if (typeof cb === 'function'){
				cb(port);
			}
    });
	});
}

module.exports = {
  serve: serve 
};

