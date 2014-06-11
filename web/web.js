var express = require('express');
var syro = require('../lib/syro');

function start() {

var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

//io.set('log level', 1);

app.set('view engine', 'ejs');
app.engine('.html', require('ejs').__express);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');

app.set('view options', {
    layout: false
});


app.use('/public', express.static(__dirname + '/public'));

var renderBase = {};

app.get('/', function(req, res) {
    app.render('index', renderBase, function(err, html) {
        res.send(200, html);
    });
});

app.get('view').prototype.render = function(options, fn) {
    // this.engine(this.path, options, fn);
    this.engine(this.path, options, function(err, html) {
        // do something
        fn(err, html);
    });
};

var connections = 0;

var dasher = syro.startDashboard();

/* @todo
dasher.checkSeekerStatus = function() {
    var self = this;
    var lastUpdate = self.lastUpdate;
    setTimeout(function() {
        var now = Date.now();
        for (var id in lastUpdate) {
            if (lastUpdate[id] - now > 10 * 1000) {
                lastUpdate[id] = 'miss';
            }
        }
    }, 30 * 1000);
};

dasher.updateSeekersStatus = function(msg, rinfo) {
    var self = this;
    var lastUpdate = self.lastUpdate;
    var id = rinfo.address + '-' + rinfo.port;
    lastUpdate[id] = Date.now();
};
*/

/**
* 通过房间名管理不同页面的数据
* index or rinfo.address + '-' + rinfo.port
*/

dasher.result = function(msg, rinfo) {

    io.sockets.in('index').emit('result', {
        rinfo: rinfo,
        msg: msg
    });
    
};

io.sockets.on('connection', function (socket) {
    //socket.emit('news', { hello: 'world' });
    socket.on('read', function (data) {
        if (0 == connections++) {
            //dasher.go();
        }
    });

    // 加入index页面的房间
    socket.on('join', function(data) {
        socket.join(data);
    });

    socket.on('disconnect', function () {
        if (0 == --connections) {
            //dasher.stop();
        }
    });
});

server.listen(dasher.config.webport);

console.log('syro center server is running at http://127.0.0.1:' + dasher.config.webport + '...');

}

//start();
exports.start = start;
