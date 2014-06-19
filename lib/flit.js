"use strict";

// hack flight
require('./flight');

var util = require('util');
var Orchestrator = require('orchestrator');
var Fiber = require('fibers');

var Logger = require('flightplan/lib/logger');
var Briefing = require('flightplan/lib/briefing');
var LocalFlight = require('flightplan/lib/local');
var RemoteFlight = require('flightplan/lib/remote');

var runner = require('./runner');

function Flit() {
    if (!(this instanceof Flit)) {
        return new Flit();
    }

    Orchestrator.call(this);

    this._briefing = null;
    this.target = {
        destination: null,
        hosts: []
    };
    this.hasRemoteFlights = false;
    this.logger = new Logger();

    require('./flit-elapse')(this);
    require('./flit-log')(this);

    process.on('SIGINT', function () {
        this.logger.space();
        this.logger.error('Flightplan was interrupted'.error);
        process.exit(1);
    }.bind(this));

    process.on('uncaughtException', function (err) {
        this.logger.error(err.stack);
        this.doneCallback && this.doneCallback(err);
//        this.debriefingCallback();
        this.logger.error('Flightplan aborted'.error);
        process.exit(1);
    }.bind(this));

}
util.inherits(Flit, Orchestrator);

Flit.prototype.reset = function () {
    Orchestrator.prototype.reset.call(this);
    this._briefing = null;
    this.target = {
        destination: null,
        hosts: []
    };
    this.hasRemoteFlights = false;
    this.emit('reset');
};

Flit.prototype.briefing = function (config) {
    if (!config) {
        return this._briefing;
    }
    this._briefing = new Briefing(this, config);
    return this;
};

Flit.prototype._add = function (taskCls, name, dep, fn) {
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

    this.add(name, dep, taskCls ? runner(name, new taskCls(this, fn)) : fn);

    if (taskCls == RemoteFlight) {
        this.hasRemoteFlights = true;
    }

    return this;
};

Flit.prototype.local = function (name, dep, fn) {
    this._add(LocalFlight, name, dep, fn);
    return this;
};

Flit.prototype.remote = function (name, dep, fn) {
    this._add(RemoteFlight, name, dep, fn);
    return this;
};

Flit.prototype.task = function (name, dep, fn) {
    this._add(null, name, dep, fn);
    return this;
};

Flit.prototype.abort = function (msg) {
    this.stop(msg);
};

//Flit.prototype.done = function (fn) {
//    this.on('done', fn);
//    return this;
//};

Flit.prototype.requiresDestination = function () {
    return this.hasRemoteFlights;
};

Flit.prototype.start = function (tasks, destination, cb) {
    var args = [];
    if (typeof tasks === 'function') {
        cb = tasks;
        tasks = null;
        destination = null;
    } else if (typeof destination === 'function') {
        cb = destination;
        destination = null;
    }

    tasks && args.push(tasks);
    cb && args.push(cb);

    this.target.destination = destination;

    if (this.requiresDestination() && !this.briefing().hasDestination(this.target.destination)) {
        this.logger.error((destination || '<empty>').warn, 'is not a valid destination');
        process.exit(1);
    }

    if (this.briefing()) {
        this.target.hosts = this.briefing().getHostsForDestination(this.target.destination);
    }

    new Fiber(function () {

        Orchestrator.prototype.start.apply(this, args);

    }.bind(this)).run();
};

// let people use this class from our instance
Flit.prototype.Flit = Flit;

module.exports = Flit;