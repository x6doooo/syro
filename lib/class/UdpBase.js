/**
* Module dependencies.
*/

var dgram = require('dgram');

/**
* @class Manager
* @classdesc 封装Udp通信的基类
* @constructor
*/
var UdpBase = function() {};

/**
* Udp实例计数
* @static
*/
UdpBase.count = 0;

/**
* Udp默认配置
* @static
*/
UdpBase.defaultConfig = {
    sockeType: 'udp4',
    port: 9527
};

/**
* Udp默认事件处理
* @static
*/
UdpBase.defaultEventCallbacks = {
    'error': function (err) {
        var selft = this;
        //console.log("udp-controller error:\n" + err.stack);
        self.controller.close();
    },
    'listening': function () {
        var self = this;
        var address = self.controller.address();
        //console.log("udp-controller listening " +
        //    address.address + ":" + address.port);
    },
    'message': function (msg, rinfo) {
        var self = this;
        //console.log("upd-controller got msg from " + rinfo.address + ":" + rinfo.port);
    },
    'close': function() {
        //console.log('udp-controller close!');
    }
};

var proto = UdpBase.prototype;

/**************************** @lends UdpBase.prototype ****************************/

/**
* 实例初始化
* @method init
* @param {object} [cfg] - 初始化参数
* @param {string} [cfg.sockeType] - 类型 udp4 或 udp6
* @param {number} [cfg.port]
*/
proto.init = function(cfg) {
    var self = this;
    /** 
    * 缓存未完全送达的分包数据
    * @instance
    */
    self.msgCache = {};
    cfg = cfg || {};

    /**
    * 第index个udp实例、用于生成标记通信的uuid
    * @instance
    */
    self.index = UdpBase.count++;

    /**
    * 发送通信次数、用于生成标记通信的uuid
    * @instance
    */
    self.count = 0;

    /**
    * dgram控制器
    * @instance
    */
    var controller = self.controller = dgram.createSocket(cfg.sockeType || UdpBase.defaultConfig.sockeType);
    controller.bind(cfg.port || UdpBase.defaultConfig.port);
};

/**
* 绑定udp事件的默认处理
*/
proto.listen = function() {
    this.addEventHandle('error');
    this.addEventHandle('listening');
    this.addEventHandle('message');
};

/**
* 获取udp通信计数，超过65535次归零
*/
proto.getCount = function() {
    if(this.count < 65535) {
        return this.count++;
    }
    this.count = 0;
    return this.count;
};

/**
* 增加udp通信事件的绑定
*/
proto.addEventHandle = function(event, cb) {
    var self = this;
    cb = cb || UdpBase.defaultEventCallbacks[event] || function() {};
    self.controller.on(event, cb.bind(self));
};

/**
* Udp发送
* @param {object} msg
* @param {string} msg.method - 指定接收方处理消息的方法
* @param {object} [msg.data] - 消息数据
* @param {object} target - 目标
* @param {string} target.address
* @param {number} target.port
* @param {function} [cb] - 回调函数
*/
proto.send = function(msg, target, cb) {

    var self = this;

    // msg.data的最大byte数
    var max = 8000;

    // 默认回调为抛出通信错误
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

    // 通信时间戳 & uuid
    var timestamp = Date.now();
    var uuid = self.index + '-' + timestamp + '-' + self.getCount();

    quequeSend(0);

    // 递归发送，将超过长度限制的数据拆分。
    function quequeSend(x) {

        var tem = {
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
