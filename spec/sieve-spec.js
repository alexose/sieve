var sieve = require('../sieve');
var nock = require('nock');
var assert = require('assert');

var url = 'http://example.com'; 
var entry = { url: url };

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

  it('should support "then"', function(done){
  
    var copy = JSON.parse(JSON.stringify(entry));
    copy.then = { url: 'http://example.com/then' };

    nock(copy.url)
      .persist()
      .get('/')
      .reply(200, data)
      .get('/then')
      .reply(200, moreData); 

    sieve(copy, function(result){
      assert.equal(moreData, result);
      done();
    });
  });

  it('should preserve cookies between "then" requests', function(done){
    
    nock(url)
      .post('/one')
      .reply(200, undefined, { 'Set-Cookie': 'TEST1=12345' })
      .get('/two')
      .reply(200, undefined, { 'Set-Cookie': 'TEST2=67890' })
      .get('/three')
      .reply(200, function(uri, requestBody){
        console.log(this.req.headers);
      });
   
    entry = {
      url: url + '/one',
      method: 'POST',
      then: {
        url: url + '/two',
        then: {
          url: url + '/three',
        }
      }
    }

    sieve(entry, function(response){
        done();
    }); 
  });
});
