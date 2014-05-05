var exec = require('child_process').exec;

function df(handle) {
    var self = this;
    exec('df -klP', function(err, stdout, stderr) {
        if (err) throw err;

        stdout = stdout.split(/\r|\n|\r\n/);
        stdout.pop();
        stdout.shift();

        var tem;
        var data = [];
        stdout.forEach(function(v) {
            v = v.trim().split(/\s+/);
            data.push({
                name: v[0],
                total: v[1],
                used: v[2]
            });
        });
        handle && handle(data);
    });
}

exports.disk = df;
