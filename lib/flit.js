"use strict";

var util = require('util');
var Orchestrator = require('orchestrator');
var Fiber = require('fibers');
var path = require('path');
var fs = require('fs');

var existsSync = fs.existsSync || path.existsSync;

var cli = require('./flit/cli');
var miwa = require('./miwa');
var Context = require('./context');
var Logger = require('./logger');

// Expose internal grunt libs.
function requiref(name) {
    return Flit.prototype[name] = require('./flit/' + name);
}

function Flit() {
    if (!(this instanceof Flit)) {
        return new Flit();
    }

    Orchestrator.call(this);

    this.tools = {};
    this.plugins = {};
    this.config = require('./config')();
    this.ctx = undefined;
    this.logger = new Logger();

    require('./flit-elapse')(this);
    require('./flit-log')(this);

    process.on('SIGINT', function () {
        this.logger.space();
        this.logger.error('Flightplan was interrupted');
        process.exit(1);
    }.bind(this));

    process.on('uncaughtException', function (err) {
        this.logger.error(err.stack);
        this.doneCallback && this.doneCallback(err);
        this.logger.error('Flightplan aborted');
        process.exit(1);
    }.bind(this));

}

util.inherits(Flit, Orchestrator);

requiref('cli');
requiref('help');

Flit.prototype.init = function (config) {
    this.config.init(config);
};

Flit.prototype.reset = function () {
    Orchestrator.prototype.reset.call(this);
    this.tools = {};
    this.plugins = {};
    this._miwa = null;
    this.config.init();
    this.ctx = null;
    this.emit('reset');
};

Flit.prototype.loadPlugin = function (name) {

    if (this._hasPlugin(name)) {
        console.warn('Plugin is already loaded');
        return;
    }

    var plugin;
    if (typeof name === 'function') {
        plugin = name;
    } else if (name.match(/^\//)) {
        // try absolute path
        plugin = require(name);
    } else if (existsSync(__dirname + '/plugins/' + name + '.js')) {
        // try built-in adapter
        plugin = require('./plugins/' + name);
    } else {
        // try foreign adapter
        try {
            plugin = require(name);
        } catch (e) {
            this.logger.error('\nWARNING: Flit plugin "' + name + '" is not installed,\nto install run:\n\n    npm install ' + name, '\n');
            throw e;
        }
    }

    this._registerPlugin(name, plugin);

    plugin = plugin(this);
    if (typeof plugin === 'function') {
        this.use(plugin);
    }
    return this;
};

Flit.prototype._hasPlugin = function (name) {
    if (!name) return false;
    if (typeof name === 'string') {
        return !!this.plugins[name];
    }

    if (this.plugins._) {
        return this.plugins._.indexOf(name) >= 0;
    }

    return false;
};

Flit.prototype._registerPlugin = function (name, plugin) {
    if (typeof name === 'string') {
        this.plugins[name] = plugin;
    } else if (typeof name ==='function') {
        this.plugins._ = this.plugins._ || [];
        this.plugins._.push(plugin);
    }
};

Flit.prototype.lazymiwa = function () {
    if (!this._miwa) {
        this._miwa = miwa();
        this.loadPlugin('init');
    }
};

Flit.prototype.use = function (fn) {
    this.lazymiwa();
    this._miwa.use(fn);
    return this;
};

Flit.prototype._handle = function (ctx, done) {
    this._miwa.handle(ctx, done);
};

Flit.prototype._wrap = function (fn) {
    if (fn.length <= 1) {
        return function () {
            return fn.call(this, this.ctx);
        }
    } else {
        return function (cb) {
            return fn.call(this, this.ctx, cb);
        }
    }
};

Flit.prototype._add = function (name, dep, fn) {
    if (!fn && typeof dep === 'function') {
        fn = dep;
        dep = undefined;
    }
    dep = dep || [];
    fn = fn || function () {
    }; // no-op
    if (!name) {
        throw new Error('Task requires a name');
    }
    // validate name is a string, dep is an array of strings, and fn is a function
    if (typeof name !== 'string') {
        throw new Error('Task requires a name that is a string');
    }
    if (typeof fn !== 'function') {
        throw new Error('Task ' + name + ' requires a function that is a function');
    }
    if (!Array.isArray(dep)) {
        throw new Error('Task ' + name + ' can\'t support dependencies that is not an array of strings');
    }
    dep.forEach(function (item) {
        if (typeof item !== 'string') {
            throw new Error('Task ' + name + ' dependency ' + item + ' is not a string');
        }
    });

    this.add(name, dep, this._wrap(fn));

    return this;
};

Flit.prototype.taskLocal = function (name, dep, fn) {
    if (!fn && typeof dep === 'function') {
        fn = dep;
        dep = undefined;
    }
    this._add(name, dep, function (c) {
        if (fn) c.local(fn);
    });
    return this;
};

Flit.prototype.taskRemote = function (name, dep, fn) {
    if (!fn && typeof dep === 'function') {
        fn = dep;
        dep = undefined;
    }
    this._add(name, dep, function (c) {
        if (fn) c.remote(fn);
    });
    return this;
};

Flit.prototype.task = function (name, dep, fn) {
    if (!fn && typeof dep === 'function') {
        fn = dep;
        dep = undefined;
    }
    this._add(name, dep, fn);
    return this;
};

Flit.prototype.abort = function (msg) {
    this.stop(msg);
};

Flit.prototype.stop = function () {
    Orchestrator.prototype.stop.apply(this, arguments);
};

Flit.prototype.start = function (/* tasks, destination, options, cb */) {
    var self = this;
    var args = Array.prototype.slice.call(arguments);
    var i, arg, tasks, destination, options, cb;

    for (i = 0; i < args.length; i++) {
        arg = args[i];
        if (!tasks && (typeof arg === 'string' || Array.isArray(arg))) {
            tasks = arg;
        } else if (!destination && typeof arg === 'string') {
            destination = arg;
        } else if (!options && typeof arg === 'object') {
            options = arg;
        } else if (!cb && typeof arg === 'function') {
            cb = arg;
        } else if (arg) {
            throw new Error('Unable recognized argument', arg);
        }
    }

    args = tasks ? [tasks] : [];

    if (typeof cb === 'function') {
        this.doneCallback = cb;
    }

    this.ctx = Context(this);
    this.ctx.destination = destination;
    this.ctx.options = options || {};

    this.lazymiwa();
    this._handle(this.ctx, function (err, ctx) {
        if (err) return self.stop(err);
        new Fiber(function () {
            Orchestrator.prototype.start.apply(self, args);
        }.bind(this)).run();
    });
};


// Expose some grunt metadata.
Flit.package = require('../package.json');
Flit.version = Flit.package.version;
Flit.prototype.package = Flit.package;
Flit.prototype.version = Flit.version;

// let people use this class from our instance
Flit.prototype.Flit = Flit;

module.exports = Flit;