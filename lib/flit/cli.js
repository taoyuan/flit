"use strict";

var chalk = require('chalk');
var semver = require('semver');
var archy = require('archy');
var Liftoff = require('liftoff');
var tildify = require('tildify');
var interpret = require('interpret');
var yargs = require('yargs');

//var treetask = require('../lib/tree-task');

var logger = console;

module.exports = function cli(env) {
    var options = yargs.usage('$0 [options] [task [task ...]] [@destination]', {
        'help': {
            alias: 'h',
            description: 'Display this help text.'
        },
        'base': {
            description: 'Specify an alternate base path. By default, all file paths are relative to the flitfile.'
        },
        'flitfile': {
            description: 'Specify an alternate flitfile. By default, flit looks in the' +
                'current or parent directories for the nearest flitfile.js or' +
                'flitfile.coffee file.'
        },
        'require': {
            alias: 'r',
            description: 'Modules to pre-load'
        },
        'debug': {
            alias: 'd',
            description: 'Enable debugging mode for tasks that support it.'
        },
        'verbose': {
            alias: 'v',
            description: 'Verbose mode. A lot more information output.'
        },
        'version': {
            alias: 'V',
            description: 'Print the flit version. Combine with --verbose for more info.'
        },
        // Even though shell auto-completion is now handled by flit-cli, leave this
        // option here for display in the --help screen.
        'completion': {
            description: 'Output shell auto-completion rules. See the flit-cli documentation for more information.'
        }
    }).argv;

    var flit = this;

    if (options.version) {
        // Not --verbose.
        logger.log(this.package.name, 'v' + this.version);

        if (options.verbose) {

        }

        return;
    }

    var target = parseArgs(argv._);


    // TODO


    // this is what actually loads up the flitfile
    var flitConfig = require(env.configPath);
    argv.verbose && logger.log('Using flitfile', chalk.magenta(tildify(env.configPath)));

    flitConfig(flit);

    process.nextTick(function () {
//        if (argv.tasks) {
//            return logTasks(env, self);
//        }
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

//function logTasks(env, localFlit) {
//    var tree = treetask(localFlit.tasks);
//    tree.label = 'Tasks for ' + chalk.magenta(tildify(env.configPath));
//    archy(tree)
//        .split('\n')
//        .forEach(function (v) {
//            if (v.trim().length === 0) return;
//            logger.log(v);
//        });
//}