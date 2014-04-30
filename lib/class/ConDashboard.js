
var dgram = require('dgram');
var fs = require('fs');
var path = require('path');
var ConBase = require('./ConBase');
var UdpCommander = require('./UdpCommander');

/**
* @todo offline
* @todo seekerOffline
* @todo process.on('exit',...
*/

var ConDashboard = function(cfg) {
    this.init(cfg);
};

var proto = ConDashboard.prototype = new ConBase;
proto.constructor = ConDashboard;

proto.init = function(cfg) {
    var self = this;
    self.type = 'dashboard';
    ConBase.prototype.init.call(self, cfg);
    self.config.seekers = self.config.seekers || {};
    self.udper = new UdpCommander({
        sockeType: self.config.sockeType,
        port: self.config.port
    });
    self.udper.msgHandler = function(msg, rinfo) {
        self[msg.method] && self[msg.method](msg, rinfo);
    };  
};

proto.seekerOnline = function(msg, rinfo) {
    var self = this;

    var seekers = self.config.seekers;

    var address = rinfo.address;
    var port = rinfo.port;

    if (seekers[address] && seekers[address].indexOf(port) >= 0) {
        return;
    }

    if (!seekers[address]) {
        seekers[address] = [];
    }

    seekers[address].push(port);

    self.updateConfigFile();
};

proto.online = function() {
    var self = this;
    var seekers = self.config.seekers;
    self.handleClient('all', 'dashboard');
};

proto.stop = function(target) {
    this.handleClient(target, 'stopPush');
};

proto.start = function(target) {
    this.handleClient(target, 'startPush');
};
/*
    who -> 'all' or { address, port }
*/
proto.handleClient = function(who, op, data) {
    var self = this;
    var msg = {
        method: op
    };

    if (data) {
        msg.data = data;
    }

    if (who == 'all') {
        var seekers = self.config.seekers;
        var addr;
        for (addr in seekers) {
            seekers[addr].forEach(function(p) {
                self.udper.send(msg, {
                    address: addr,
                    port: p
                }, function(err, bytes) {
                    if (err) throw err;
                }.bind(self));
            });
        }
        return;
    }

    self.udper.send(msg, who, function(err, bytes) {
        if (err) throw err;
    }.bind(self));
};

proto.result = function(msg, rinfo) {
    // 实例覆盖
};

module.exports = ConDashboard;
