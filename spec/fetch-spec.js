var fetch = require('../lib/fetch.js');
var helpers = require('../helpers');

describe('fetch', function(){
  var data = {
  }
  helpers.serve(data, function(){
    describe('basic functions', function(){
      it('should successfully GET a resource from an HTTP server', function(done){
        done();
      });
      it('should successfully POST data and retreive a resource from an HTTP server', function(done){
        done();
      });
      it('should successfully GET a resource from an HTTPS server', function(done){
        done();
      });
      it('should successfully POST data and retreive a resource from an HTTPS server', function(done){
        done();
      });
    });
  }); 
});
