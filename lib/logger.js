var util = require('util'),
    chalk = require('chalk'),
    dateformat = require('dateformat');

chalk.enabled = true;

var messageTypes = {
    log: 'yellow',
    info: 'blue',
    success: 'green',
    warn: 'yellow',
    error: 'red',
    command: 'white',
    debug: 'cyan'
};

Object.keys(messageTypes).forEach(function(type) {
    chalk[type] = chalk[messageTypes[type]];
});

var __debug = false; // persistent

function Logger(debug) {
    __debug = (debug !== null && debug !== undefined) ? debug : __debug;
    this.symbol = '✈';
    this.prefix = '';

    this._logStream = function() {
        var writePrefix = true;
        return function(symbol, prefix, msg) {
            var lines = msg.split('\n');
            var out = [];
            for(var i=0, len=lines.length; i < len; i++) {
                if(writePrefix && lines[i] !== '') {
                    out.push(this._format(symbol, prefix, lines[i]));
                    if(i+1 === lines.length) {
                        writePrefix = false; // stream will continue
                    }
                } else {
                    if(i+1 !== lines.length || lines[i] === '') {
                        writePrefix = true;
                    }
                    out.push(lines[i]);
                }
            }
            process.stdout.write(out.join('\n'));
        }.bind(this);
    };

    this.stdout = (function() {
        var logStream = this._logStream();
        return function() {
            var data = this._parseArgs(arguments, false);
            logStream(chalk.gray('>'), this.prefix, data);
        }.bind(this);
    }.bind(this))();

    this.stderr = (function() {
        var logStream = this._logStream();
        return function() {
            var data = this._parseArgs(arguments, false);
            logStream(chalk.error('>'), this.prefix, data);
        }.bind(this);
    }.bind(this))();

    this.stdwarn = (function() {
        var logStream = this._logStream();
        return function() {
            var data = this._parseArgs(arguments, false);
            logStream(chalk.warn('>'), this.prefix, data);
        }.bind(this);
    }.bind(this))();
}

Object.keys(messageTypes).forEach(function(type) {
    Logger.prototype[type] = function() {
        var msg = this._parseArgs(arguments);
        this._log(chalk[type](this.symbol), this.prefix, msg);
    };
});

Logger.prototype = util._extend(Logger.prototype, {

    enableDebug: function(flag) {
        __debug = !!flag;
    },

    debugEnabled: function() {
        return __debug;
    },

    clone: function() {
        return new Logger();
    },

    cloneWithPrefix: function(prefix) {
        var logger = this.clone();
        logger.symbol = '●';
        logger.prefix = prefix;
        logger._format = function(symbol, prefix, msg) {
            return this._wrap(util.format('%s %s %s', chalk.gray(prefix || ''), symbol, msg));
        };
        return logger;
    },

    command: function() {
        var msg = this._parseArgs(arguments);
        this._log(chalk.command('$'), this.prefix, chalk.command(msg));
    },

    debug: function() {
        if(__debug) {
            var msg = this._parseArgs(arguments);
            this._log(chalk.debug(this.symbol), this.prefix, msg);
        }
    },

    space: function() {
        process.stdout.write('\n');
    },

    log: function() {
        var msg = this._parseArgs(arguments);
        this._log(chalk.cyan(this.symbol), this.prefix, chalk.cyan(msg));
    },

    _log: function(symbol, prefix, msg) {
        var lines = msg.split('\n');
        var out = [];
        for(var i=0, len=lines.length; i < len; i++) {
            var line = lines[i];//.trim();
            out.push(this._format(symbol, prefix, line));
        }
        process.stdout.write(out.join('\n') + '\n');
    },

    format: util.format, // convenience method

    _format: function(symbol, prefix, msg) {
        return this._wrap(util.format('%s%s %s', symbol, prefix, msg));
    },

    _parseArgs: function(args, trim) {
        var str = Array.prototype.slice.call(args, 0).join(' ');
        if(!!trim) {
            str = str.trim();
        }
        return str;
    },

    _wrap: function (msg) {
        var time = '[' + chalk.grey(dateformat(new Date(), 'HH:MM:ss.l')) + ']';
        return time + ' ' + msg;
    }

});

module.exports = Logger;