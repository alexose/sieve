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
  
  it('should support arrays', function(done){
    var arr = ['one', 'two', 'three'],
        data = { page: arr },
        entry = { url: 'http://example.com/{{page}}' };
        expected = [
          { url: 'http://example.com/one' },
          { url: 'http://example.com/two' },
          { url: 'http://example.com/three' }
        ];
   
    var result = template(entry, data);
    assert.deepEqual(result, expected);
    done();
  });
  
  it('should support a mix of arrays and strings', function(done){
    var arr = ['one', 'two', 'three'],
        data = {
          domain: 'example',
          page: arr, 
          subdirectory: arr 
        },
        entry = { url: 'http://{{domain}}.com/{{subdirectory}}/{{page}}' };
        expected = [
          { url: 'http://example.com/one/one' },
          { url: 'http://example.com/one/two' },
          { url: 'http://example.com/one/three' },
          { url: 'http://example.com/two/one' },
          { url: 'http://example.com/two/two' },
          { url: 'http://example.com/two/three' },
          { url: 'http://example.com/three/one' },
          { url: 'http://example.com/three/two' },
          { url: 'http://example.com/three/three' }
        ];
   
    var result = template(entry, data);
    assert.deepEqual(result, expected);
    done();
  });
});
