var exec = require('child_process').exec;

var fs = require('fs');

function formatNetDev(handle) {
    var self = this;
    fs.readFile('/proc/net/dev', 'utf8', function(err, data) {
        if (err) throw err;
        data = data.split(/\r|\n|\r\n/);
        data.shift();
        
        var keys = data.shift();
        keys = keys.trim().replace(/\|/g, ' ').split(/\s+/);

        var ipkts = keys.indexOf('packets');
        var ibytes = keys.indexOf('bytes');
        var opkts = keys.lastIndexOf('packets');
        var obytes = keys.lastIndexOf('bytes');
        
        data.pop();

        var tem = [];
        var values;
        data.forEach(function(v) {
            v = v.trim().split(':');
            if (v[0] == 'lo') return;
            values = v[1].split(/\s+/);
            if (values[ipkts] == 0) return;
            tem.push({
                name: v[0],
                ips: values[ipkts],
                ibs: values[ibytes],
                ops: values[opkts],
                obs: values[obytes]
            });
        });
        
        handle && handle(tem);

    });
}

function formatStdout(str) {
    str = str.split(/\n|\r|\r\n/);
    var keys = [];
    var data = [];
    var tem;

    keys = str[0].split(/\s+/);

    var ips = keys.indexOf('Ipkts') - 1;
    var ibs = keys.indexOf('Ibytes') - 1;
    var ops = keys.indexOf('Opkts') - 1;
    var obs = keys.indexOf('Obytes') - 1;

    var hasit = {};
    for (var i = 1, len = str.length - 1; i < len; i++) {
        tem = str[i].trim();
        tem = tem.split(/\s+/);
        k = tem.shift();
        if (k == 'lo0' || tem[ips] == 0 || hasit[k]) continue;
        hasit[k] = true;
        data.push({
            name: k,
            ips: tem[ips],
            ibs: tem[ibs],
            ops: tem[ops],
            obs: tem[obs]
        });
    }
    return data;
}

function netstat(handle) {
    var self = this;
    exec('netstat -ib', function(err, stdout, stderr) {
        if (err) throw err;
        var r = formatStdout(stdout);
        handle && handle(r);
    });
}

function networkInfo(handle) {

    if (fs.existsSync('/proc/net/dev')) {
        formatNetDev(handle);
    } else {
        netstat(handle);
    }

}

exports.network = networkInfo;

