var sieve = require('../../sieve');
var assert = require('assert');
var select = require('../../lib/select');
var corpus = '{ "test": [1,2,3], "data": "hello", "options": { "blah": 12 }}';

describe('jsonselect plugin tests', function() {

  it('should support a basic jsonselect query', function(done){

    var selector = '.data';
    var expected = 'hello';

    select(corpus, selector, 'jsonselect', function(result){
      assert.equal(result, expected);
      done();
    });
  });
  
  it('should support a slightly more complicated jsonselect query', function(done){

    var selector = '.test :nth-child(2)';
    var expected = '2';

    select(corpus, selector, 'jsonselect', function(result){
      assert.equal(result, expected);
      done();
    });
  });
});
