define(function(require, exports, module){

    /**
    * 监控数据前端模板
    */
    var src = $('#mathine-template').html();
    var tpl = Handlebars.compile(src);

    /**
    * 获取数值的展示颜色
    */
    var getColor = {};
    getColor.cpu = function(k, v) {
        if (k == 'usage') {
            if (v > 90) return 'color-red';
            if (v > 60) return 'color-gold';
            return 'color-green';
        }
        return 'color-white';
    };
    getColor.loadavg = function() {
        return 'color-white';
    };
    getColor.mem = function(key, value) {
        if (key == 'per') {
            if (value > 90) return 'color-red';
            if (value > 60) return 'color-gold';
            return 'color-green';
        }
        return 'color-white';
    };
    getColor.disk = function(key, value) {
        if (key == 'used') {
            if (value > 90) return 'color-red';
            if (value > 60) return 'color-gold';
            return 'color-green';
        }
        return 'color-white';
    };

    /**
    * 监控数据控制器
    */
    var fmt = require('../modules/format');
    var fmtMaster = fmt.master;
    var fmtWorker = fmt.worker;

    fmtMaster.prototype.handleResult = function(worker, re, msg) {
        var self = this;
        if (re && worker['print_' + msg.data.name]) {
            worker['print_' + msg.data.name](re, msg);
        }
    };

    fmtWorker.prototype.init = function(hostname, ip) {
        this.hostname = hostname;
        this.ip = ip;
        this.cache = {};
        this.uuid = 'mathine-' + ip;  // dom 识别
        var el = tpl({
            uuid: this.uuid,
            hostname: hostname,
            ip: ip
        });
        this.el = $(el).appendTo('.main-wrap'); 
        this.initCharts();  
    };

    /**
    * 初始化chart配置
    */
    var initChartConfig = require('../modules/index-chart');

    fmtWorker.prototype.initCharts = function() {

        var self = this;
        var charts = self.charts = {};
        var keys = ['cpu', 'network-in', 'network-out'];
        var cfg;
        $.each(keys, function(k, v) {

            cfg = initChartConfig(v);
            if (v == 'cpu' || v == 'mem') {
                cfg.yAxis.max = 100;
                cfg.tooltip.formatter = function() {
                    return this.y.toFixed(2) + ' %';
                };
            } else {
                cfg.tooltip.formatter = function() {
                    return self.man.formatByteUnit(this.y);
                };
            }
            cfg.yAxis.min = 0;
            console.log(cfg);
            self.el.find('.chart-' + v).highcharts(cfg);
            charts[v] = self.el.find('.chart-' + v).highcharts();
        });

    };

    /**
    * 更新chart
    */
    fmtWorker.prototype.updateChart = function(chartName, value, time) {
        var self = this;
        var chart = self.charts[chartName];

        /*
        if (chartName == 'network') {
            
            var sin = chart.get('s0');
            var sout = chart.get('s1');
                
            [sin, sout].forEach(function(v) {
                
                var graph = v.graph;
                var area = v.area;
                var currentShift = (graph && graph.shift) || 0;
                v.data[0].remove(false, false);
                
            });
            
            sin.addPoint([time, value[0]]);
            sout.addPoint([time, value[1]]);

        } else {
        */
            var series = chart.get('s0');
            var graph = series.graph;
            var area = series.area;
            var currentShift = (graph && graph.shift) || 0;

            Highcharts.each([graph, area, series.graphNeg, series.areaNeg], function (shape) {
                if (shape) {
                    shape.shift = currentShift + 1;
                }
            });
            /*
            if (chartName == 'network-in' || chartName == 'network-out') {
                console.log(time, value);
            }
            */
            series.data[0].remove(false, false);
            series.addPoint([time, value]);
        
        //}


    };

    fmtWorker.prototype.print_cpu = function(data, msg) {
        var self = this;
        var el = self.el;

        var tem = {};
        tem.user = (data.user / data.total * 100).toFixed(2) * 1;
        tem.sys = (data.sys / data.total * 100).toFixed(2) * 1;
        tem.idle = (data.idle / data.total * 100).toFixed(2) * 1;

        var color = getColor.cpu('usage', tem.user + tem.sys);

        var field;
        $.each(tem, function(k, v) {
            field = '.cpu-' + k;
            self.print(field, v + ' %', color);
        });
        self.updateChart('cpu', tem.user + tem.sys, msg.timestamp);
    };

    fmtWorker.prototype.print_loadavg = function(data, msg) {
        var self = this;

        var tem = {};
        tem['1min'] = data[0].toFixed(2);
        tem['5min'] = data[1].toFixed(2);
        tem['15min'] = data[2].toFixed(2);

        $.each(tem, function(k, v) {
            field = '.loadavg-' + k;
            self.print(field, v, 'color-white');
        });

    };    

    fmtWorker.prototype.print_uptime = function(data) {
        this.print('.os-uptime', data, 'color-white');
    };

    fmtWorker.prototype.print_mem = function(data, msg) {
        var self = this;
        var tem = data;

        var per = (data.used / data.total * 100).toFixed(2) * 1;
        var detail = self.man.formatByteUnit(data.total - data.used) + ' / ' + self.man.formatByteUnit(data.total);
        var color = getColor.mem('per', per);
        self.print('.mem-used', per + ' %', color);
        self.print('.mem-detail', detail, color);
        //self.updateChart('mem', per, msg.timestamp);
    };

    fmtWorker.prototype.print_diskUsage = function(data) {
        if(!data) return;
        var self = this;
        var used = (data.used / data.total * 100).toFixed(2) * 1;
        var color = getColor.disk('used', used);
        self.print('.disk-used', used + ' %', color);

        var free = self.man.formatByteUnit(data.free);
        var total = self.man.formatByteUnit(data.total);
        used = self.man.formatByteUnit(data.used);

        self.print('.disk-used-num', used, color);
        self.print('.disk-free', free, color);
        self.print('.disk-total', total, color);

    };
    fmtWorker.prototype.print_diskIO = function(data) {
        if (!data) return;
        var self = this;
        var read_Bps = 0;
        var write_Bps = 0;
        if (data.rt != 0) read_Bps = data.rb / data.rt * 1000;
        if (data.wt != 0) write_Bps = data.wb / data.wt * 1000;

        self.print('.disk-read-KBps', self.man.formatByteUnit(read_Bps) + '/s');
        self.print('.disk-write-KBps', self.man.formatByteUnit(write_Bps) + '/s');
    };



/*
    fmtWorker.prototype.print_disk = function(data) {
        var self = this;
        var man = self.man;
        //var free = data.total - data.used;
        var used = (data.used / data.total * 100).toFixed(2) * 1;

        var color = getColor.disk('used', used);

        var detail = man.formatByteUnit(data.used * 1024) + ' / ' + man.formatByteUnit(data.total * 1024);

        self.print('.disk-used', used + ' %', color);
        self.print('.disk-detail', detail, color);

    };
    */

    fmtWorker.prototype.print_netIO = function(data, msg) {
        var self = this;
        var format = self.man.formatByteUnit;
        var color = 'color-white';

        var tem = {};

        var ibs = format(data.currentTimeValue.ibytes);
        var obs = format(data.currentTimeValue.obytes);

        tem['in'] = ibs + '/s ';
        tem['out'] = obs + '/s ';

        tem['in-total'] = format(data.ibytes) || 0;
        tem['in-pkts'] = data.ipkts || 0;

        tem['out-total'] = format(data.obytes) || 0;
        tem['out-pkts'] = data.opkts || 0;

        $.each(tem, function(k, v) {
            self.print('.network-' + k, tem[k], color);
        });
        
        //console.log(data.currentTimeValue.ibs, msg.timestamp);
        /*
        self.updateChart('network', 
            [data.currentTimeValue.ibytes, data.currentTimeValue.obytes],
            msg.timestamp);
        */
        self.updateChart('network-in', data.currentTimeValue.ibytes, msg.timestamp);
        self.updateChart('network-out', data.currentTimeValue.obytes, msg.timestamp);
    };


    fmtWorker.prototype.print = function(field, value, color) {
        color = color || 'color-white';
        var f = this.el.find(field);
        var oc = f.data('color');
        if (oc != color) {
            f.removeClass(oc).addClass(color).data('color', color);
        }
        f.html(value);
    };


    var ctr = {};

    ctr.init = function() {
        var socket = this.socket = io.connect();
        socket.emit('join', 'index');
        //socket.join('index');
        socket.on('result', function(data) {
            /*
            if (data.msg.data.name == 'netIO') {
                console.log(data);
            }*/
            //console.log(data.msg.data.name);
            ctr.handle(data);
        });
        ctr.fmt = new fmt.master;
    };

    ctr.handle = function(data) {
        ctr.fmt.handle(data.msg, data.rinfo);
    };

    module.exports = ctr;

});
