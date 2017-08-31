var sieve = require('../../sieve');
var assert = require('assert');
var select = require('../../lib/select');
var corpus = '<html><body><b class="data">hello</b><div>hola</div></body></html>';

describe('jquery plugin tests', function() {

  it('should support a basic jquery query', function(done){

    var selector = '$(".data")';
    var expected = 'hello';

    select(corpus, selector, 'jquery', function(result){
      assert.equal(result, expected);
      done();
    });
  });
  
  it('should support a slightly more complicated jquery query', function(done){

    var selector = '$("body :nth-child(2)")';
    var expected = 'hola';

    select(corpus, selector, 'jquery', function(result){
      assert.equal(result, expected);
      done();
    });
  });
});
