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
			"headers" : {
				"User-Agent" : "Lynx/2.8.8dev.3 libwww-FM/2.14 SSL-MM/1.4.1"
			},
			"fill" : ""
		},
		{
			"url" : "https://api.github.com/repos/alexose/sieve/branches",
			"method" : "POST",
			"fill" : ""
		}
	]

By default, Sieve will introduce a user-agent header.  If you wish to override the user-agent header, you can include 'User-Agent' among your headers.
