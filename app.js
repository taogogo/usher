var redis = require('redis');
var express = require('express');
var socketio = require('socket.io');

var app = express.createServer();
var client = redis.createClient();

app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(__dirname + '/public'));


var io = socketio.listen(app);

// schema API

function loadUsherSchema(req, res, next) {
  var schema = req.schema = {
    name: req.param('name'),
    exists: false,
    data: null
  };
  schema.key = ['schema', schema.name].join('_');
  client.exists(schema.key, function(err, exists) {
    if(exists === 1) {
      schema.exists = true;
      client.hgetall(schema.key, function(err, data) {
        schema.data = data;
        next(err);
      });
    }
    else {
      next(err);
    }
  });
}

app.get('/schemas', function(req, res) {
  client.lrange('schemas', 0, -1, function(err, list) {
    list = (list || []).map(function(item) {
      return JSON.parse(item);
    });
    res.json(list);
  });
});

app.get('/schemas/:name', loadUsherSchema, function(req, res) {
  if(req.schema.exists) {
    res.json(req.schema.data);
  }
  else {
    res.json({}, 404);
  }
});

function createOrUpdateSchema(req, res) {
  client.hmset(req.schema.key, req.body, function() {
    if(!req.schema.exists) {
      client.rpush('schemas', JSON.stringify({
        name: req.param('name')
      }));
    }

    res.json(req.body, {
      'Location': '/schemas/' + req.param('name')
    }, req.conf.exists ? 200 : 201);
  });
}
app.post('/schemas', createOrUpdateSchema);
app.post('/schemas/:name', createOrUpdateSchema);



// conf API

function loadUsherConf(req, res, next) {
  var conf = req.conf = {
    account: req.param('account'),
    name: req.param('name'),
    exists: false,
    data: null
  };
  conf.key = ['conf', conf.account, conf.name].join('_');
  client.exists(conf.key, function(err, exists) {
    if(exists === 1) {
      conf.exists = true;
      client.hgetall(conf.key, function(err, data) {
        conf.data = data;
        next(err);
      });
    }
    else {
      next(err);
    }
  });
}

app.get('/confs', function(req, res) {
  client.lrange('confs', 0, -1, function(err, list) {
    list = (list || []).map(function(item) {
      return JSON.parse(item);
    });
    res.json(list);
  });
});

app.get('/confs/:account/:name', loadUsherConf, function(req, res) {
  if(req.conf.exists) {
    res.json(req.conf.data);
  }
  else {
    res.json({}, 404);
  }
});

function create_or_update(req, res) {
  client.hmset(req.conf.key, req.body, function() {
    if(!req.conf.exists) {
      client.rpush('confs', JSON.stringify({
        account: req.param('account'),
        name: req.param('name')
      }));
    }

    res.json(req.body, {
      'Location': '/confs/' + req.param('account') + '/' + req.param('name')
    }, req.conf.exists ? 200 : 201);
  });
}
app.post('/confs', loadUsherConf, create_or_update);
app.post('/confs/:account/:name', loadUsherConf, create_or_update);

app.listen(1337, "0.0.0.0");
