var sieve = require('../sieve');
var nock = require('nock');
var assert = require('assert');

var entry = {
  url: 'http://example.com'
}

var data = 'hello';
var moreData = 'wow!';

describe('sanity tests', function() {

  it('should process a single job', function(done){
    nock(entry.url).get('/').reply(200, data); 
    sieve(entry, function(result){
      assert.equal(data, result);
      done();
    });
  });

  it('should process an array of jobs', function(done){
    nock(entry.url).persist().get('/').reply(200, data); 
    var arr = [entry, entry, entry];
    sieve(arr, function(result){
      result.forEach(function(d,i){
        assert.equal(data, d);
      });
      done();
    });
  });
});

describe('advanced functionality', function() {

  var copy = Object.assign({}, entry);
  copy.then = { url: 'http://example.com/then' };

  it('should support "then"', function(done){
    nock(copy.url)
      .get('/')
      .reply(200, data)
      .get('/then')
      .reply(200, moreData); 

    sieve(copy, function(result){
      assert.equal(moreData, result);
      done();
    });
  });
});
