"use strict";

var _ = require('lodash');
var chalk = require('chalk');
var tildify = require('tildify');
var path = require('path');

var logger = console;

module.exports = function cli(env, argo) {
    var flit = this;

    // this is what actually loads up the flitfile
    var flitConfig = require(env.configPath);
    if (typeof flitConfig === 'function') flitConfig(flit);

    var parser = argo({
        'task': {
            position: 0,
            list: true,
            help: 'Task(s) to execute.'
        },
        '@destination': {
            position: 1,
            help: 'Destination for task to perform.'
        },
        'tasks': {
            alias: 'T',
            help: 'Show available tasks.'
        }
    }, flit.tools);
    var options = parser.parse();

    // handle version
    var _tasks, _options;
    if (options.version) {
        logger.log('flit v' + flit.version);
        if (options.verbose) {
            // --verbose
            console.log('Install path: ' + chalk.magenta(tildify(path.dirname(env.modulePath))));

            // Display available tasks (for shell completion, etc).
            _tasks = Object.keys(flit.tasks).sort();
            console.log('Available tasks: ' + chalk.magenta(_tasks.join(' ')));

            _options = [];
            _.reduce(parser.specs, function (result, item) {
                if (item.position == undefined) {
                    _options.push('--' + item.name);
                    if (item.abbr) {
                        _options.push('-' + item.abbr);
                    }
                }
            });
            console.log('Available options: ' + chalk.magenta(_options.join(' ')));
        }

        return;
    }

    // handle help
    if (options.help) {
        return logger.log(parser.getUsage());
    }

    if (options.tasks) {
        // Display available tasks (for shell completion, etc).
        _tasks = Object.keys(flit.tasks).sort();
        return console.log(chalk.magenta(_tasks.join('\n')));
    }

    // handle verbose for using flitfile
    if (options.verbose) {
        logger.log('Using flitfile', chalk.magenta(tildify(env.configPath)));
    }

    var target = parseArgs(options._);

    process.nextTick(function () {
        flit.start(target.tasks, target.destination, options);
    });

};

function parseArgs(args) {
    var tasks = [];
    var destination = undefined;
    args.forEach(function (arg) {
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