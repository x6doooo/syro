var UdpBase = require('./UdpBase');

var UdpCommander = function(cfg) {
    this.init(cfg);
    this.listen();
};

var proto = UdpCommander.prototype = new UdpBase;

proto.constructor = UdpCommander;

proto.listen = function() {
    var self = this;
    self.addEventHandle('error');
    self.addEventHandle('listening');
    self.addEventHandle('message', function(msg, rinfo) {
        UdpBase.defaultEventCallbacks.message.call(self, msg, rinfo);
        msg = JSON.parse(msg.toString());
        if (self.msgHandler && Object.prototype.toString.call(msg) == '[object Object]' && msg.isSyroMsg) {
            if (msg.total != 1) {
                self.msgCache[msg.uuid] = self.msgCache[msg.uuid] || {};
                self.msgCache[msg.uuid].lastUpdate = Date.now();
                self.msgCache[msg.uuid][msg.index] = msg;
                if (!self.msgCache[msg.uuid].recieve) {
                    self.msgCache[msg.uuid].recieve = 0;
                }
                self.msgCache[msg.uuid].recieve++;
                if (self.msgCache[msg.uuid].recieve != msg.total) return;
                var data = '';
                for (var i = 0, len = msg.total; i < len; i++) {
                    data += self.msgCache[msg.uuid][i].data;
                }
                self.msgCache[msg.uuid] = null;
                msg.data = data;
            }
            if (msg.data) {
                msg.data = JSON.parse(msg.data);
            }
            self.msgHandler(msg, rinfo);
        }
    });
};

// TODO: 过期检测加入配置
// udp包分包过期检测
proto.clearCache = function() {
    var self = this;
    var cache = self.msgCacche;
    
    var now = Date.now();

    var limit = 10 * 60 * 1000;

    for (var uuid in cache) {
        if(now - cache[uuid].lastUpdate > limit) {
            cache[uuid] = null;
        }
    }
};

module.exports = UdpCommander;
