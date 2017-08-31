var sieve = require('../../sieve');
var assert = require('assert');
var select = require('../../lib/select');
var corpus = '<html><body><table><tr><td>hello</td><td>there</td></tr></table></body></html>';

describe('xpath plugin tests', function() {

  it('should support a basic xpath query', function(done){

    //var selector = '//table/td[0]/text()';
    var selector = '//td/text()';
    var expected = 'hello';

    select(corpus, selector, 'xpath', function(result){
      assert.equal(result, expected);
      done();
    });
  });
});
