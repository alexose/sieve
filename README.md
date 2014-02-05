Sieve
=====

Sieve is a general-purpose middleman to help you write client-side applications in an instant.  It serves many purposes:

	* Acts as a proxy for APIs that don't support JSONP
	* Minifies, caches, and eliminates excess fields
	* Combines HTTP requests
	* Provides methods for using XPath
	* Makes writing tests easy and automatic

Sieve is provided as a node module and has no external dependencies.  It's probably not something you want to use in production, though.  Not yet.

Usage
-----

All Sieve requests are made by POSTing raw JSON:

	[
		{
			"url" : "https://api.github.com/repos/alexose/sieve/commits",
			"method" : "POST",
			"fill" : ""
		},
		{
			"url" : "https://api.github.com/repos/alexose/sieve/branches",
			"method" : "POST",
			"fill" : ""
		}
	]
