var redis = require('redis');
var express = require('express');
var socketio = require('socket.io');

var app = express.createServer();
var client = redis.createClient();

app.use(app.router);
app.use(express.static(__dirname + '/public'));

var io = socketio.listen(app);

app.get('/', function(req, res, next) {
  client.incr('hits');
  next();
});
app.listen(1337, "0.0.0.0");
