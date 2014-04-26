/*

    UDP通信模块基类

*/

var dgram = require('dgram');

var UdpBase = function() {};

// 计数器，记录发送次数
UdpBase.count = 0;

UdpBase.defaultConfig = {
    sockeType: 'udp4',
    port: 9527
};

UdpBase.defaultEventCallbacks = {
    'error': function (err) {
        var selft = this;
        console.log("udp-controller error:\n" + err.stack);
        self.controller.close();
    },
    'listening': function () {
        var self = this;
        var address = self.controller.address();
        console.log("syro-controller listening " +
            address.address + ":" + address.port);
    },
    'message': function (msg, rinfo) {
        var self = this;
        console.log("upd-controller got msg from " + rinfo.address + ":" + rinfo.port);
    },
    'close': function() {
        console.log('udp-controller close!');
    }
};

var proto = UdpBase.prototype;

proto.init = function(cfg) {
    var self = this;
    self.msgCache = {};
    cfg = cfg || {};
    self.index = UdpBase.count++;
    self.count = 0;
    var controller = self.controller = dgram.createSocket(cfg.sockeType || UdpBase.defaultConfig.sockeType);
    controller.bind(cfg.port || UdpBase.defaultConfig.port);
};

proto.listen = function() {
    this.addEventHandle('error');
    this.addEventHandle('listening');
    this.addEventHandle('message');
};

// 获取计数，超过65535次归零
proto.getCount = function() {
    if(this.count < 65535) {
        return this.count;
    }
    this.count = 0;
    return this.count;
};

// 增加事件处理
proto.addEventHandle = function(event, cb) {
    var self = this;
    cb = cb || UdpBase.defaultEventCallbacks[event] || function() {};
    self.controller.on(event, cb.bind(self));
};

// 发送
proto.send = function(msg, target, cb) {

    var self = this;

    var max = 8000;

    cb = cb || function(err, bytes) {
        if (err) throw err;
    }

    var len = 0;

    // 计算数据长度，判断是否需要分包。
    if (msg.data) {
        if (typeof msg.data != 'string') {
            msg.data = JSON.stringify(msg.data);
        }

        //data需要转为string才能分拆
        //分拆后的string在发送前还会和整个包的数据经过stringify处理一次
        //所以长度还会发生变化，需要预先根据这种变化计算包的长度
        len = ~~(JSON.stringify(msg.data).length / max);
        max /= JSON.stringify(msg.data).length / msg.data.length;
        max = ~~max;
    }

    var timestamp = Date.now();
    var uuid = self.index + '-' + timestamp + '-' + self.getCount();

    quequeSend(0);

    // 递归发送，将超过8k的数据拆分。
    function quequeSend(x) {

        tem = {
            isSyroMsg: true,
            total: len + 1,
            index: x,
            uuid: uuid,
            timestamp: timestamp,
            method: msg.method
        }

        if (msg.data) {
            tem.data = msg.data.slice(max * x, max * (x + 1));
        }
        
        tem = JSON.stringify(tem);

        tem = new Buffer(tem);

        self.controller.send(tem, 0, tem.length, target.port, target.address, function(err, bytes) {
            if (err) throw err;
            if (x != len) {
                quequeSend(++x);
            } else {
                cb(err, bytes);
            }
        });
    }
};

module.exports = UdpBase;
