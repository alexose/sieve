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
    
    var cookies = ['TEST1=12345', 'TEST2=67890'];

    nock(url)
      .post('/one')
      .reply(200, undefined, { 'Set-Cookie': cookies[0] })
      .get('/two')
      .reply(200, undefined, { 'Set-Cookie': cookies[1] })
      .get('/three')
      .reply(200, function(uri, requestBody){
        assert.equal(cookies.join('; '), this.req.headers.cookie);
        done();
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

    sieve(entry, function(response){}); 
  });

  it('should allow another selector engine to be specified', function(done){

    var expected = 'success',
        json = { result: expected };

    nock.cleanAll();

    nock(url)
      .get('/')
      .reply(200, json);

    entry = {
      url: url,
      engine: 'jsonselect',
      selector: '.result'
    }

    sieve(entry, function(result){
      assert.equal(result, expected);
      done();
    });
  });

  it('should support templating', function(done){
    
    var data = { key: 'template' },
        success = 'success';
    
    nock.cleanAll();

    nock(url)
      .get('/')
      .reply(200, data)
      .get('/' + data.key)
      .reply(200, success);

    entry = {
      url: url,
      selector: {
        result: '.key'
      },
      engine: 'jsonselect',
      then: {
        url: url + "/{{result}}" 
      }
    }
    
    sieve(entry, function(result){
      assert.equal(success, result);
      done();
    });
  });
});
