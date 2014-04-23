var dgram = require('dgram');
var defaultCfg = require('./ConCfg');

var B = function() {};

B.prototype.init = function(cfg) {
    cfg = cfg || {};
    var self = this;
    self.config = {
        sockeType: cfg.socketType || defaultCfg.socketType,
        port: cfg.port || defaultCfg.port,
        interval: defaultCfg.interval
    };
    self.controller = dgram.createSocket(self.config.sockeType);
};

B.prototype.listen = function() {
    var self = this;
    var controller = self.controller;
    controller.on("error", function (err) {
        console.log("udp-controller error:\n" + err.stack);
        controller.close();
    });

    controller.on("message", function (msg, rinfo) {
        
        console.log("upd-controller got: " + msg + " from " +
            rinfo.address + ":" + rinfo.port);
        
        if (Object.prototype.toString.call(msg) == '[object Object]' && 
            msg.isSyroMsg && 
            typeof self[msg.method] == 'function') {

            self[msg.method](msg, rinfo);

        }

    });

    controller.on("listening", function () {
        var address = controller.address();
        console.log("syro-controller listening " +
            address.address + ":" + address.port);
    });

    controller.bind(self.config.port);
};

module.exports = B;