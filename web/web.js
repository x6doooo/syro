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

// console.log(dasher.udper);

/**
* 处理通信方的状态
*/
var d_udper = dasher.udper;

if (d_udper.friendsTimer) {
    clearInterval(d_udper.friendsTimer);
    d_udper.friendsTimer = null;
}

d_udper.friendsLiveTimeLimit = 15 * 1000;

d_udper.friendsTimer = setInterval(function() {
    var friends = d_udper.friends;
    var line = Date.now() - d_udper.friendsLiveTimeLimit;
    var tem;
    for (var addr in friends) {
        tem = friends[addr];
        if (tem.lastUpdate < line && tem.status == 'alive') {
            tem.status = 'offline';
            io.sockets.in('index').emit('status', {
                rinfo: addr,
                msg: tem.status
            });
        }
        //console.log(addr, tem, line);
    }
}, d_udper.friendsLiveTimeLimit);


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

    //console.log(dasher.);

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
