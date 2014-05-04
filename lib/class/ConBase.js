/**
* Module dependencies.
*/
var fs = require('fs');
var path = require('path');

/**
* @class ConBase
* @classdesc 监测控制器基类，主要控制配置文件的处理逻辑
* @constructor
*/
var ConBase = function() {};

var proto = ConBase.prototype;

/**************************** @lends ConBase.prototype ****************************/

/**
* 实例初始化
* @desc 基类的初始化主要负责更新this.config并在当前目录建立配置文件
* @method init
*/
proto.init = function(cfg) {
    this.file = process.cwd() + '/' + this.type + '_conf.json';
    if (!fs.existsSync(this.file)) {
        this.createConfigFile(this.type);
    }
    this.updateConfig(cfg);
};

/**
* 更新配置：当前实例没有初始化配置的时候，需要加载配置文件获得默认配置
*/
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

/**
* 创建配置文件
* @desc 配置文件模板位于lib/conf目录下。新建的配置文件位于process.cwd()目录下。
*/
proto.createConfigFile = function(type) {
    var p = path.join(__dirname, '../conf');
    var f = fs.readFileSync(p + '/' + type + '_conf_default.json');
    fs.writeFileSync(process.cwd() + '/' + type + '_conf.json', f);
};

/**
* 加载配置文件
*/
proto.loadConfigFile = function() {
    var file = this.file;
    if (fs.existsSync(file)) {
        return JSON.parse(fs.readFileSync(file).toString());
    }
    throw new Error('syro config file lost!');
};

/**
* 更新配置文件
*/
proto.updateConfigFile = function() {
    var self = this;
    var config = JSON.stringify(self.config, null, 4);
    
    var file = self.file;

    fs.writeFileSync(file, config);
};

module.exports = ConBase;
