var fs = require('fs');
var path = require('path');

var ConBase = function() {};

var proto = ConBase.prototype;

proto.init = function(cfg) {
    this.file = process.cwd() + '/' + this.type + '_conf.json';
    if (!fs.existsSync(this.file)) {
        this.createConfigFile(this.type);
    }
    this.updateConfig(cfg);
};

proto.createConfigFile = function(type) {
    var p = path.join(__dirname, '../conf/');
    var f = fs.readFileSync(p + '/' + type + '_conf_default.json');
    fs.writeFileSync(process.cwd() + '/' + type + '_conf.json', f);
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

    fs.writeFileSync(file, config);
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
