Sieve
=====

Sieve makes any resource on the web available to your client-side application.  It serves many purposes:

* Acts as a proxy for APIs that don't support JSONP
* Simplifies excessively verbose responses using selectors (JSONSelect, Xpath, etc.) 
* Combines multiple HTTP requests into one

Sieve is provided as a node module and has very minimal dependencies.  It's probably not something you want to use in production, though.  Not yet.

Usage
-----

Sieve requests begin as JSON objects with the following layout:

    var request = {
            "url" : "https://api.github.com/repos/alexose/sieve/commits",
            "selector" : ".commit .date"
        };

By default, Sieve uses the JSONSelect engine, which expects to receive raw JSON.  If your target URL doesn't return raw JSON, however, you can specify other selector engines:

    var request = {
            "url" : "http://google.com/finance",
            "selector" : "//td[@class='price']",
            "engine" : "xpath"
        };

You can then POST the request directly to the Sieve server:

    $.post("http://sieve.server.example", request, function(result){
        console.log(result);
    });

Which will log the following data to the console:

    {
        "result":[
            "2014-02-12T18:19:31Z",
            "2014-02-12T18:19:31Z",
            "2014-02-12T15:36:45Z",
            "2014-02-12T15:36:45Z",
            "2014-02-12T15:00:53Z"
        ]
    }

If your access control policy is particularly restrictive, don't worry!  You can also put provide the JSON as a base64-encoded URL parameter. It sounds crazy, but it's actually not so bad in practice:

    var string = btoa(JSON.stringify(json));

    $.ajax({
        url : "http://sieve.server.example?callback=?",
        data : { json : string },
        dataType : "jsonp",
        success: function(result){
            console.log(result);
        }
    });

Advanced
--------

### Headers ###

You can specify any headers you like in the "headers" object.

    var request = {
            "url" : "https://api.github.com/repos/alexose/sieve/commits",
            "headers" : {
                "Accept-Language" : "en-US,en;q=0.8,es;q=0.6",
                "Referer" : https://www.google.com/,
                "User-Agent" : "Lynx/2.8.8dev.3 libwww-FM/2.14 SSL-MM/1.4.1"
            }
        };

By default, Sieve will introduce a WebKit user-agent header.  If you wish to override the user-agent header, you can include 'User-Agent' among your headers, as noted above.

### Authentication ###

Sieve only supports basic HTTP authentication as a URL parameter:

    var request = [
            {
                "url" : "https://user:password@api.github.com/repos/alexose/sieve/commits"
            }
        ];

### Combining multiple queries ###

You can also provide an array of requests in a single query:

    var request = [
            {
                "url" : "https://api.github.com/repos/alexose/sieve/commits",
                "headers" : {
                    "User-Agent" : "Lynx/2.8.8dev.3 libwww-FM/2.14 SSL-MM/1.4.1"
                },
                "selector" : ".commit .date"
            },
            {
                "url" : "https://api.github.com/repos/alexose/sieve/branches",
                "selector" : ".name"
            }
        ];
     
Sieve will wait until each request is finished resolving before returning an array of its own:

    [
        {
            "result": [
                "2014-02-13T18:58:13Z",
                "2014-02-13T18:58:13Z",
                "2014-02-12T18:19:31Z",
                "2014-02-12T18:19:31Z",
                "2014-02-12T15:36:45Z",
            ]
        },
        {
            "result": [
                "async_selectors",
                "master",
                "then",
                "xpath"
            ]
        }
    ]

### Combining multiple selectors ###

Even though most selector engines provide ways to combine multiple queries, it can be helpful to run separate queries and receive separate results.  Sieve provides a way to do just that without having to make multiple HTTP requests:

    var request = {   
            "url" : "https://api.github.com/repos/alexose/sieve/commits",
            "selector" : {
                "dates" : ".commit .date",
                "shas" : ".sha"
            }
        };

Which will yield:

    {
        "result": {
            "dates": [
                "2014-02-13T20:41:14Z",
                "2014-02-13T20:41:14Z",
                "2014-02-13T20:37:29Z",
                "2014-02-13T20:37:29Z",
                "2014-02-13T20:28:16Z"
            ],
            "shas": [
                "e3d89e43bdc3c3a4e2dd17195880391fdea86c77",
                "4d399f06e90442e85e02bc7f2603fb6edf7404aa",
                "731a266b6598e3018ccea88bcfb94b4876ef93d1",
                "731a266b6598e3018ccea88bcfb94b4876ef93d1",
                "0ecb46e3ff3098ea2e5c4540d4a62a718b07cc12"
            ]
        }
    }

### Nested Requests & Templating ###

Here's where things start to get a little crazy:  You can use the results from a keyed selector object (see "Combining Multiple Selectors") to query even more URLs:

    var request = { 
            "url" : "https://api.github.com/users/alexose/repos",
            "method" : "GET",
            "selector" : {
                "name" : ":nth-child(-n+4) .name"
            },
            "then" : {
                "url" : "https://api.github.com/repos/alexose/{{name}}/commits",
                "selector" : ".date"
            }
        }

Which will yield:

    {
        "result": [
            {
                "result": [
                    "2012-05-06T18:12:27Z",
                    "2012-05-06T18:12:27Z",
                    "2012-05-06T16:28:57Z",
                    "2012-05-06T16:28:57Z",
                    "2012-05-06T15:47:47Z"
                ]
            },
            {
                "result": [
                    "2012-11-12T19:05:45Z",
                    "2012-11-12T19:05:45Z",
                    "2012-11-12T15:37:39Z",
                    "2012-11-12T15:37:39Z",
                    "2012-11-12T15:21:01Z"
                ]
            },
            {
                "result": [
                    "2013-02-13T03:43:52Z",
                    "2013-02-13T03:43:52Z",
                    "2013-02-13T02:44:44Z",
                    "2013-02-13T02:44:44Z",
                    "2013-02-13T02:19:04Z"
                ]
            }
        ]
    }
