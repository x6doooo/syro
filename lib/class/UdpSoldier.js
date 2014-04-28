var UdpBase = require('./UdpBase');

var UdpSoldier = function(cfg) {
    this.init(cfg);
    this.listen();
};

var proto = UdpSoldier.prototype = new UdpBase;

proto.constructor = UdpSoldier;

proto.listen = function() {
    var self = this;
    self.addEventHandle('error');
    self.addEventHandle('listening');
    self.addEventHandle('message', function(msg, rinfo) {
        UdpBase.defaultEventCallbacks.message.call(self, msg, rinfo);
        msg = JSON.parse(msg.toString());
        if (msg.data) {
            msg.data = JSON.parse(msg.data);
        }
        self.msgHandler && self.msgHandler(msg, rinfo);
    });
};

module.exports = UdpSoldier;
