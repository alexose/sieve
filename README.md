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

### Combining multiple queries ###

You can also provide an array of requests in a single query:

    var request = [
            {
                "url" : "https://api.github.com/repos/alexose/sieve/commits",
                "method" : "POST",
                "headers" : {
                    "User-Agent" : "Lynx/2.8.8dev.3 libwww-FM/2.14 SSL-MM/1.4.1"
                },
                "selector" : ".commit .date"
            },
            {
                "url" : "https://api.github.com/repos/alexose/sieve/branches",
                "method" : "POST",
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
                "cf63b8f67a1efe122d14b96e5465f1ac759d8481",
                "abd17c144a63fed0010d18e6e4ce814c61793a0b",
                "6191988fabe62dc8ab5224fa407e9ca1e6a66a3b",
                "6191988fabe62dc8ab5224fa407e9ca1e6a66a3b",
                "1a40540b00ab42cb07b038efcc1ef150f0446865"
            ]
        }
    ]

### Authentication ###

Sieve only supports basic HTTP authentication as a URL parameter:

    var request = [
            {
                "url" : "https://user:password@api.github.com/repos/alexose/sieve/commits"
            }
        ];


### Nested Requests ###

### URL Templating ###

### Iteration ###

### Streamlining ###
