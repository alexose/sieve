Sieve
=====

The API for your API.

Sieve is a general-purpose middleman to help you write client-side applications in an instant.  It serves many purposes:

	* Acts as a proxy for APIs that don't support JSONP
	* Minifies, caches, and eliminates excess fields
	* Combines HTTP requests
	* Provides methods for using XPath
	* Makes writing tests easy and automatic

Sieve is provided as a node module and has no external dependencies.  It's probably not something you want to use in production, though.  Not yet.

Usage
-----

Write your client-side application as if you had the perfect API.

	GET http://alexose.com/sieve?urls=
