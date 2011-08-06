var redis = require('redis');

var client = redis.createClient();

var http = require('http');
http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('test\n');
}).listen(1337, "0.0.0.0");
console.log('Server running at http://127.0.0.1:1337/');
