var fetch = require('../lib/fetch.js');
var nock = require('nock'); 
var url = 'http://example.com';
var assert = require('assert');

var data = 'hello';
var entry = {
  url: url,
  wait: 0
};

describe('fetch', function(){
  describe('basic functions', function(){

    it('should successfully GET a resource from an HTTP server', function(done){
      nock(url).get('/').reply(200, data);

      fetch(entry, function(response){
        assert.equal(data, response.result);
        done();
      });
    });
    
    it('should successfully handle 302 directs', function(done){
      var path = '/redirected';

      nock(url)
        .get('/')
        .reply(302, undefined, { Location: url + path })
        .get(path)
        .reply(200, data);

      fetch(entry, function(response){
        assert.equal(data, response.result);
        done();
      });
    });

    it('should successfully POST data and retreive a resource from an HTTP server', function(done){
      nock(url).post('/').reply(200, function(uri, requestBody){
        return requestBody;
      });
      
      var copy = Object.assign({}, entry);
      copy.method = 'POST';
      copy.body = JSON.stringify({ payload: data });

      fetch(copy, function(response){
        var json = JSON.parse(response.result);
        assert.equal(data, json.payload);
        done();
      });
    });

    it('should successfully GET a resource from an HTTPS server', function(done){
      var replaced = url.replace('http','https');
      nock(replaced).get('/').reply(200, data);

      var copy = Object.assign({}, entry);
      copy.url = replaced;

      fetch(copy, function(response){
        assert.equal(data, response.result);
        done();
      });
    });

    it('should successfully POST data and retreive a resource from an HTTPS server', function(done){
      var replaced = url.replace('http','https');
      nock(replaced).post('/').reply(200, function(uri, requestBody){
        return requestBody;
      });
      
      var copy = Object.assign({}, entry);
      copy.url = replaced;
      copy.method = 'POST';
      copy.body = JSON.stringify({ payload: data });

      fetch(copy, function(response){
        var json = JSON.parse(response.result);
        assert.equal(data, json.payload);
        done();
      });
    });
  });
  
  describe('advanced functions', function(){
    it('should successfully fill a form', function(done){
      nock(url).post('/').reply(200, function(uri, requestBody){
        return requestBody;
      });
      
      var copy = Object.assign({}, entry);
      copy.form = {
        field1: 'test1',
        field2: 'test2'
      }

      var expected = 'field1=test1&field2=test2';

      fetch(copy, function(response){
        assert.equal(expected, response.result);
        done();
      }); 
    });
  });
});
