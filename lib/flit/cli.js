"use strict";

var chalk = require('chalk');
var tildify = require('tildify');
var path = require('path');

var logger = console;

module.exports = function cli(env, options) {
    var flit = this;

    var target = parse(options._);

    if (options.verbose) {
        logger.log('Using flitfile', chalk.magenta(tildify(env.configPath)));
    }

    process.nextTick(function () {
        flit.start(target.tasks, target.destination, options);
    });

};

function parse(argo) {
    var tasks = [];
    var destination = undefined;
    argo.forEach(function (arg) {
        if (arg.indexOf('@') === 0) {
            destination = arg.slice(1);
        } else {
            tasks.push(arg);
        }
    });
    return {
        tasks: tasks,
        destination: destination
    }
}