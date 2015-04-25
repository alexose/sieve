var Sieve = require('../sieve.js');

describe('init', function () {
  it('should initialize and return a new Sieve', function(){
    var sieve = new Sieve();
    expect(sieve).toBeTruthy();
  });
})
