var sieve = require('../sieve');
var nock = require('nock');
var assert = require('assert');

var url = 'http://example.com'; 
var entry = { url: url };

var data = 'hello';
var moreData = 'wow!';

describe('advanced options', function() {

  it('should execute a single callback', function(done){
    nock(entry.url).get('/').reply(200, data); 
    sieve(entry, function(result){
      assert.equal(data, result);
      done();
    });
  });

  it('should support the "onFinish" hook', function(done){
    nock(entry.url).persist().get('/').reply(200, data); 
    var arr = [entry, entry, entry];
    sieve(arr, { onFinish: function(result){
      result.forEach(function(d,i){
        assert.equal(data, d);
      });
      done();
    }});
  });
  
  it('should support the "onResult" hook', function(done){
    nock(entry.url)
      .persist()
        .get('/')
        .reply(200, data)
        .get('/next')
        .reply(200, moreData);

    var results = [];

    sieve({
      url: entry.url,
      then: {
        url: entry.url + '/next'
      }
    }, { onResult: function(result){
      results.push(result);
    }, onFinish: function(){
      assert.deepEqual([data, moreData], results);
      done();
    }});
  });
});
