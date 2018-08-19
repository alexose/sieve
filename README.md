Sieve [![Build Status](https://travis-ci.com/alexose/sieve.svg?branch=master)]
=====

Try the [live demo](http://sieve.alexose.com)!

Sieve makes any resource on the web available to your application with minimal overhead, and zero extra dependencies.

Installation
------------

    npm install sievejs

Usage
-----

    var sieve = require('sievejs');
    
    var request = {
        "url": "https://api.github.com/repos/alexose/sieve/commits",
        "selector": ".commit .date"
    };

    sieve.get(request, function(result){
        console.log(result);  
    });


Development
-----------

Tests are run under Mocha:

    npm test

Documentation
-------------

Additional documentation can be found on the [Wiki](https://github.com/alexose/sieve/wiki).
