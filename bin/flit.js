#!/usr/bin/env node

var chalk = require('chalk');
var semver = require('semver');
var archy = require('archy');
var Liftoff = require('liftoff');
var tildify = require('tildify');
var interpret = require('interpret');
var program = require('commander');

var treetask = require('../lib/tree-task');
var completion = require('../lib/completion');
var logger = new (require('../lib/logger'))();

// set env var for ORIGINAL cwd
// before anything touches it
process.env.INIT_CWD = process.cwd();

var pkg = require('../package');

var options = {};
function handleConfig(val) {
    var a = val.split('=');
    if (a.length == 2) options[a[0]] = a[1];
}

var argv = program
    .usage('[options] [task [task ...]] [@destination]')
    .version(pkg.version)
    .option('-f, --flitfile <file>', 'path to flitfile (default: flitfile.js)')
    .option('-r, --require <file>', 'modules to pre-load')
    .option('-T, --tasks', 'show tasks as tree style.')
    .option('-v, --verbose', 'verbose mode. A lot more information output.')
    .option('-d, --debug', 'enable debugging mode for tasks that support it.')
    .option('--cwd <path>', 'specify the working directory to run flit')
    .option('--completion', 'output shell auto-completion rules.')
    .option('-c, --config <key=value>', 'set custom config using in plugin.', handleConfig)
    .parse(process.argv);

var cli = new Liftoff({
    name:'flit',
    completions: completion,
    extensions: interpret.jsVariants
});

var target = parseArgs(argv.args);

// wire up a few err listeners to liftoff
cli.on('require', function (name) {
    argv.verbose && logger.log('Requiring external module', chalk.magenta(name));
});

cli.on('requireFail', function (name) {
    logger.error(chalk.red('Failed to load external module'), chalk.magenta(name));
});

cli.launch({
    cwd: argv.cwd,
    configPath: argv.flitfile,
    require: argv.require,
    completion: argv.completion
}, invoke);

function invoke(env) {
    if (!env.modulePath) {
        logger.error(
            chalk.error('Local flit not found in'),
            chalk.magenta(tildify(env.cwd))
        );
        logger.log(chalk.error('Try running: npm install flit'));
        process.exit(1);
    }

    if (!env.configPath) {
        logger.error(chalk.error('No flitfile found'));
        process.exit(1);
    }

    // check for semver difference between cli and local installation
    if (semver.lt(pkg.version, env.modulePackage.version) && argv.verbose) {
        logger.warn(chalk.warn('Warning: flit version mismatch:'));
        logger.warn(chalk.warn('Global flit is', pkg.version));
        logger.warn(chalk.warn('Local flit is', env.modulePackage.version));
    }

    // chdir before requiring flitfile to make sure
    // we let them chdir as needed
    if (process.cwd() !== env.cwd) {
        process.chdir(env.cwd);
        argv.verbose && logger.log('Working directory changed to',chalk.magenta(tildify(env.cwd)));
    }

    // this is what actually loads up the flitfile
    require(env.configPath);
    argv.verbose && logger.log('Using flitfile', chalk.magenta(tildify(env.configPath)));

    var flitInst = require(env.modulePath);

    process.nextTick(function () {
        if (argv.tasks) {
            return logTasks(env, flitInst);
        }
        if (argv.verbose) {
            logger.log('Starting task(s)');
            logger.log('    - task(s):', chalk.magenta(target.tasks));
            logger.log('    - destination:', chalk.magenta(target.destination));
            logger.log('    - options:', chalk.magenta(JSON.stringify(options)));
        }
        flitInst.start.call(flitInst, target.tasks, target.destination, options);
    });
    
}

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

function logTasks(env, localFlit) {
    var tree = treetask(localFlit.tasks);
    tree.label = 'Tasks for ' + chalk.magenta(tildify(env.configPath));
    archy(tree)
        .split('\n')
        .forEach(function (v) {
            if (v.trim().length === 0) return;
            logger.log(v);
        });
}