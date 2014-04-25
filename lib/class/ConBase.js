var fs = require('fs');
var path = require('path');

var ConBase = function() {};

var proto = ConBase.prototype;

proto.init = function(cfg) {
    this.file = process.cwd() + '/' + this.type + '_conf.json';
    if (!fs.existsSync(this.file)) {
        ConBase.createConfigFile();
    }
    // || path.join(__dirname, '../conf/', this.type + '_conf.json');
    this.updateConfig(cfg);
};

proto.loadConfigFile = function() {
    var file = this.file;
    if (fs.existsSync(file)) {
        return JSON.parse(fs.readFileSync(file).toString());
    }
    throw new Error('syro config file lost!');
};

proto.updateConfigFile = function() {
    var self = this;
    var config = JSON.stringify(self.config, null, 4);
    
    var file = self.file;

    fs.writeFile(file, config, function(err, data) {
        if (err) {
            throw err;
        }
    });
};

proto.updateConfig = function(cfg) {
    var self = this;
    self.config = self.config || self.loadConfigFile();

    if (!cfg) return;
    
    for (var key in cfg) {
        if (self.type == key || self.type + 's' == key) {
            continue;
        }
        self.config[key] = cfg[key];
    }

    self.updateConfigFile();
};

module.exports = ConBase;
