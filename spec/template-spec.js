var sieve = require('../sieve');
var nock = require('nock');
var assert = require('assert');
var data = 'hello';
var template = require('../lib/template');

describe('templating tests', function() {

  it('should correctly replace templated parts of an entry', function(done){
    var data = { domain: 'example.com' },
        entry = { url: 'http://{{domain}}/' },
        expected = { url: 'http://example.com/' };

    var result = template(entry, data);
    assert.deepEqual(result, expected);
    done();
  });
  
});
