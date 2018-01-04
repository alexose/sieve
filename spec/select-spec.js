var sieve = require('../sieve');
var nock = require('nock');
var assert = require('assert');
var data = 'hello';
var select = require('../lib/select');

describe('selector tests', function() {

  it('should support a basic regex query', function(done){

    var corpus = '<html><body><b>hello</b></body></html>';
    var regex = '/<b>(.*?)<\/b>/g';
    var expected = '<b>hello</b>';

    select(corpus, regex, 'regex', function(result){
      assert.equal(result, expected);
      done();
    });
  });
  
  it('should support a regex query with flags', function(done){

    var corpus = '<html><body><B>HELLO</B></body></html>';
    var regex = '/<b>(.*?)<\/b>/gi';
    var expected = '<B>HELLO</B>';

    select(corpus, regex, 'regex', function(result){
      assert.equal(result, expected);
      done();
    });
  });
  
  it('should support multiple selectors, a.k.a., "sets"', function(done){

    var corpus = '<html><body><b>hello</b><i>wow</i></body></html>';
    var set = {
      first: '/<b>(.*?)<\/b>/g',
      second: '/<i>(.*?)<\/i>/g'
    };
    var expected = {
      first: ["<b>hello</b>"],
      second: ["<i>wow</i>"]
    };

    select(corpus, set, 'regex', function(result){
      assert.deepEqual(result, expected);
      done();
    });
  });
  
});
