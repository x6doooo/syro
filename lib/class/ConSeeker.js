/**
 * Module dependencies.
 */

var os = require('os');
var ns = require('nsutil');

var ConBase = require('./ConBase');
var UdpSoldier = require('./UdpSoldier');
var fs = require('fs');
var path = require('path');

/**
 * @todo 心跳
 * @todo pause、continue
 */

var ConSeeker = function(cfg) {
    this.init(cfg);
};

var proto = ConSeeker.prototype = new ConBase;
proto.constructor = ConSeeker;

/**************************** @lends ConSeeker.prototype ****************************/
proto.init = function(cfg) {
    var self = this;

    // 类型标记
    self.type = 'seeker';

    // 接收方格式化数据用
    self.hostname = os.hostname();

    ConBase.prototype.init.call(self, cfg);

    self.udper = new UdpSoldier({
        sockeType: self.config.sockeType,
        port: self.config.port
    });
    self.udper.msgHandler = function(msg, rinfo) {
        self[msg.method] && self[msg.method](msg, rinfo);
    };   
};

// dashboard上线 更新配置文件
proto.dashboardOnline = function(msg, rinfo) {
    var self = this;
    self.config.dashboard = {
        address: rinfo.address,
        port: rinfo.port
    };
    self.updateConfigFile();
};

// 发送上线消息
proto.online = function() {
    msg = {
        method: 'seekerOnline'
    };
    this.udper.send(msg, this.config.dashboard);
};

// 停止推送
proto.stopPush = function() {
    var self = this;
    if (self.timer !== undefined) {
        clearInterval(self.timer);
        self.timer = undefined;
    }
    self.running = false;
};

// 开始循环推送
proto.startPush = function(msg, rinfo) {
    var self = this;

    if (self.running) return;

    self.stopPush();

    // 非dashboard远端触发的push，从配置中获取push目标
    if (!rinfo) {
        rinfo = self.config.dashboard;
    }

    self.running = true;

    /*
     * 基本数据
     *
     * 所有通讯在这个Object的data属性上挂载通信数据
     *
     */
    var dataBase = {
        host: self.hostname,
        method: 'result'
    };

    self.timer = setInterval(function() {

        /*
         *
         *  OS Module
         *
         */

        // cpu
        dataBase.data = {
            name: 'cpu',
            data: os.cpus()
        };
        self.udper.send(dataBase, rinfo);

        // uptime
        dataBase.data = {
            name: 'uptime',
            data: os.uptime()
        };
        self.udper.send(dataBase, rinfo);

        // mem
        dataBase.data = {
            name: 'mem',
            data: {
                total: os.totalmem(),
                free: os.freemem()
            }
        };
        self.udper.send(dataBase, rinfo);

        // loadavg
        dataBase.data = {
            name: 'loadavg',
            data: os.loadavg()
        };
        self.udper.send(dataBase, rinfo);

        /*
         *
         *  Nsutil
         *
         */

        ns.netIOCounters(function(err, res) {
            if (err) return;
            dataBase.data = {
                name: 'netIO',
                data: res
            };
            self.udper.send(dataBase, rinfo); 
        });

        ns.diskIOCounters(function(err, res) {
            if (err) return;
            dataBase.data = {
                name: 'diskIO',
                data: res
            };
            self.udper.send(dataBase, rinfo);
        });

        ns.diskUsage('/', function(err, res) {
            if (err) return;
            dataBase.data = {
                name: 'diskUsage',
                data: res
            };
            self.udper.send(dataBase, rinfo);
        });

        //Todo:(maybe) node's process

    }, self.config.interval);
    
};

module.exports = ConSeeker;
