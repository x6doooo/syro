var assert = require('assert');

var Commander = require('../lib/class/UdpCommander');
var Solider = require('../lib/class/UdpSoldier');

var cmd = new Commander({
    port: 9527
});

var sdr = new Solider({
    port: 9528
});

describe('Udp Module', function() {
    describe('send and recieve', function() {
/**/
        it ('normal message', function() {
            var msg = {
                method: 'hello'
            };
            cmd.msgHandler = function(msg, rinfo) {
                assert.equal(msg.method, 'hello');
            };
            sdr.send(msg, {
                address: '127.0.0.1',
                port: 9527    
            });
        });
/**/
        it ('commander send', function() {
            var msg = {
                method: 'haha'
            };
            sdr.msgHandler = function(msg, rinfo) {
                assert.equal(msg.method, 'haha');
            };
            cmd.send(msg, {
                address: '127.0.0.1',
                port: 9528
            });
        });
/**/
        it ('big message', function() {
            var data = [];
            for (var i = 0; i < 9 * 1000; i++) {
                data.push('x');
            }
            cmd.msgHandler = function(msg, rinfo) {
                assert.equal(data.length, msg.data.length);
                assert.equal(data == msg.data);
            };
            var msg = {
                method: 'test_method',
                data: data
            }
            sdr.send(msg, {
                address: '127.0.0.1',
                port: 9527
            });
        });
/**/
    })
});






