var redis = require('redis');
var http = require('http');


var client = redis.createClient();

http.createServer(function (req, res) {
  client.incr('hits');

  res.writeHead(200, {'Content-Type': 'text/plain'});
  client.get('hits', function(val) {
    res.end(val);  
  });
}).listen(1337, "0.0.0.0");
