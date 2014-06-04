var fs = require('fs');

var cons = {};
cons.dashboard = require('./class/ConDashboard');
cons.seeker = require('./class/ConSeeker');

var syro = {};

syro.startDashboard = function() {
    return syro.__start__('dashboard');
};

syro.startSeeker = function() {
    return syro.__start__('seeker');
};

syro.__start__ = function(type) {

    if (syro[type]) {
        console.log('[Failed] ' + type + ' is running...'.red);
        return;
    }

    syro[type] = new cons[type];

    return syro[type];

};

module.exports = syro;
