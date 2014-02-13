Sieve
=====

Sieve makes any resource on the web available to your client-side application.  It serves many purposes:

* Acts as a proxy for APIs that don't support JSONP
* Simplifies excessively verbose responses using JSONSelect 
* Combines multiple HTTP requests into one

And soon:

* Provides methods for using XPath
* Makes writing tests easy and automatic

Sieve is provided as a node module and only has one dependency.  It's probably not something you want to use in production, though.  Not yet.

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

If your access control policy is particularly restricture, don't worry!  You can also put provide the JSON as a URL parameter:

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
