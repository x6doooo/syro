/*! syro - v0.0.1 - 2014-05-05 */
define(function(require, exports, module){
var G = function() {
    // 每个worker控制一个seeker的数据
    this.workers = {};
};

// 格式化byte数量级
G.prototype.formatByteUnit = function(v) {
    var rt;
    var levels = [
        1024 * 1024 * 1024,' GiB',
        1024 * 1024,' MiB',
        1024,' KiB',
        1,' B'
    ];
    if (v === null) return '';
    for (var i = 0; i < 8; i++) {
        var l = levels[i];
        //if (i == 6) console.log(l);
        if (i % 2 == 0 && Math.abs(v) >= l) {
            rt = (v/l).toFixed(2) + levels[i+1];
            break;
        }
    }
    if (!rt) {
        rt = '0 B';
    }
    return rt;
/*
    var n = 0;
    var tem;
    var u = ['B', 'KB', 'MB', 'GB'];
    while (true) {
        tem = num / 1024;
        if (tem < 1) {
            break;
        }
        num = tem;
        n++;
    }
    return num.toFixed(2) + ' ' + u[n];
*/
};

// 分配数据给worker
G.prototype.handle = function(msg, rinfo) {
    var self = this;
    var workers = self.workers;

    var w = workers[rinfo.address];
    if (!w) {
        w = self.createWorker(msg.host, rinfo.address);
        w.man = self;
    }

    if (!w[msg.data.name]) {
        return;
    }

    //var re = w[msg.data.name](msg.data.data);
    var re = w[msg.data.name](msg);
    
    if (re) self.handleResult(w, re, msg);
};

// 虚函数 进一步处理处理过的数据
G.prototype.handleResult = function(worker, re, msg) { /* void */ };

/**
* 创建worker
* @private
*/
G.prototype.createWorker = function(hostname, ip) {
    var al = new L;
    al.init(hostname, ip);
    this.workers[ip] = al;
    return al;
};


// worker
var L = function() {};

L.prototype.init = function(hostname, ip) {
    this.hostname = hostname;
    this.ip = ip;
    // 缓存数据 用于需要两次对比的数据
    this.cache = {};
    /*
    this.elid = 'mathine-' + ip;  // dom 识别
    */
};

// 更新cache，output显示值
L.prototype.cpu = function(data) {

    data = data.data.data;

    if (!data || !data.length) return;

    var self = this;
    var result = {
        user: 0,
        sys: 0,
        nice: 0,
        idle: 0,
        irq: 0
    };

    var times;
    var key;
    data.forEach(function(v) {
        times = v.times;
        for (key in times) {
            result[key] += times[key];
        }
    });

    if (!self.cache.cpu) {
        self.cache.cpu = {
            user: 0,
            sys: 0,
            nice: 0,
            idle: 0,
            irq: 0,
            total: 0
        };
    }

    var tmp = {};
    var tmp_total = 0;
    var cache = self.cache.cpu;
    var cache_total = 0;

    for (key in result) {
        tmp[key] = result[key] - cache[key];
        cache[key] = result[key];
        tmp_total += tmp[key];
        cache_total += cache[key];
    }

    tmp.total = tmp_total;

    self.cache.cpu = cache;

    return tmp;

};

L.prototype.uptime = function(data) {
    data = data.data.data;
    var self = this;
    var d = ~~(data / 24 / 60 / 60);
    data -= d * 24 * 60 * 60
    var h = ~~(data / 60 / 60);
    data -= h * 60 * 60;
    var m = ~~(data / 60);
    var s = ~~(data - m * 60);

    var display = '';
    if (d) display +=  d + ' day  ';

    if (h < 10) h = '0' + h;
    if (m < 10) m = '0' + m;
    if (s < 10) s = '0' + s;
    
    display += h + ':' + m + ':' + s + ' ';
    
    return display;
};

L.prototype.mem = function(data) {
    data = data.data.data;
    var self = this;
    var total = data.total;
    var free = data.free;
    data.used = total - free;
    return data;  
};

L.prototype.loadavg = function(data) {
    return data.data.data;  
};

L.prototype.diskUsage = function(data) {
    return data.data.data;
};

L.prototype.diskIO = function(data) {
    data = data.data.data;
    var self = this;
    //var total = 0;
    //var used = 0;
    var res = {
        rb: 0,
        wb: 0,
        rt: 0,
        wt: 0
    };
    var tem;
    for (var key in data) {
        tem = data[key];
        res.rb += tem.read_bytes;
        res.wb += tem.write_bytes;
        res.rt += tem.read_time;
        res.wt += tem.write_time;
    }
    if (!tem) return;

    var rdata;
    if (!self.cache.diskIO) {
        self.cache.diskIO = res;
    } else {
        rdata = {};
        for (var k in res) {
            rdata[k] = res[k] - self.cache.diskIO[k];
        }
        self.cache.diskIO = res;
    }
    return rdata;
};

//L.prototype.netIO = function(data) {
    //console.log(data.timestamp);
    //console.log(data.data.data);
//};

L.prototype.netIO = function(data) {
    var src = data;
    data = data.data.data;
    var self = this;
    var tem = {};
    var key;

    var cache = self.cache.network;
    
    /*
     *  cache = { 
     *      
     *      ips, ibs, ops, obs, timestamp
     *
     *  }
     *
     * */

    for (var key1 in data) {
        var v = data[key1];
        for (key in v) {
            if (tem[key] === undefined) tem[key] = 0;
            tem[key] += v[key] * 1;
        }
    }
    //console.log(tem);
    /*
    data.forEach(function(v) {
    });
    */

    if (cache && cache.timestamp) {
        
        var t = src.timestamp - cache.timestamp;

        var currentTimeValue = {};

        if (t == 0) {
            return;
        }

        for (key in cache) {
            if (key == 'timestamp' || key == 'currentTimeValue') continue;
            currentTimeValue[key] = (tem[key] - cache[key]) / t * 1000;
            if (currentTimeValue[key] == Infinity || currentTimeValue == -Infinity) {
                console.log('srcdata:');
                console.log(src);
                console.log(src.timestamp, cache.timestamp);
            }
        }
    
    } else {
        currentTimeValue = {
            ibs: 0,
            ips: 0,
            obs: 0,
            ops: 0
        };
    }

    //console.log(currentTimeValue);

    tem.timestamp = src.timestamp;
    self.cache.network = tem;
    tem.currentTimeValue = currentTimeValue;
    return tem;
};

exports.master = G;
exports.worker = L   

});
