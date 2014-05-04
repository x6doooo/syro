/**
* Module dependencies.
*/

var UdpBase = require('./UdpBase');

/**
* @class UdpCommander
* @classdesc 控制端的Udp通信器
* @constructor
* @augments UdpBase
*/
var UdpCommander = function(cfg) {
    this.init(cfg);
    this.listen();
};

var proto = UdpCommander.prototype = new UdpBase;

proto.constructor = UdpCommander;

/**
* 覆盖UdpBase的listen方法，扩展message事件的处理
*/
proto.listen = function() {
    var self = this;
    self.addEventHandle('error');
    self.addEventHandle('listening');
    self.addEventHandle('message', function(msg, rinfo) {
        UdpBase.defaultEventCallbacks.message.call(self, msg, rinfo);
        msg = JSON.parse(msg.toString());
        if (self.msgHandler && Object.prototype.toString.call(msg) == '[object Object]' && msg.isSyroMsg) {

            // 对于分包发送的消息，需要等到全部包到达再触发处理
            if (msg.total != 1) {

                // 缓存包
                var theCache = self.msgCache[msg.uuid] = self.msgCache[msg.uuid] || {};
                theCache.lastUpdate = Date.now();
                theCache[msg.index] = msg;
                if (theCache.recieve === undefined) {
                    theCache.recieve = 0;
                }
                theCache.recieve++;

                // 未收齐 -> 跳出
                if (theCache.recieve != msg.total) return;

                // 已收齐 -> 粘包
                var data = '';
                for (var i = 0, len = msg.total; i < len; i++) {
                    data += theCache[i].data;
                }

                // 清缓存
                self.msgCache[msg.uuid] = null;
                msg.data = data;
            }

            // 解析数据
            if (msg.data) {
                msg.data = JSON.parse(msg.data);
            }

            // 触发处理
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
