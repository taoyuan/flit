/*
 * grunt
 * http://gruntjs.com/
 *
 * Copyright (c) 2014 "Cowboy" Ben Alman
 * Licensed under the MIT license.
 * https://github.com/gruntjs/grunt/blob/master/LICENSE-MIT
 */

'use strict';

var _ = require('lodash');
var Log = require('grunt-legacy-log').Log;
var log = new Log;

// Nodejs libs.
var path = require('path');

module.exports = function (yargs) {
    var flit = this;

    yargs.showHelp();

// Set column widths.
    var col1len = 0;
    exports.initCol1 = function (str) {
        col1len = Math.max(col1len, str.length);
    };
    help.initWidths = function () {
        // Widths for options/tasks table output.
        help.widths = [1, col1len, 2, 76 - col1len];
    };

// Render an array in table form.
    help.table = function (arr) {
        arr.forEach(function (item) {
            log.writetableln(help.widths, ['', _.pad(item[0], col1len), '', item[1]]);
        });
    };

// Methods to run, in-order.
    help.queue = [
        'initOptions',
        'initTasks',
        'initWidths',
        'header',
        'usage',
        'options',
        'optionsFooter',
        'tasks',
        'footer',
    ];

// Actually display stuff.
    help.display = function () {
        help.queue.forEach(function (name) {
            help[name]();
        });
    };


// Header.
    help.header = function () {
        log.writeln('Grunt: The JavaScript Task Runner (v' + flit.version + ')');
    };

// Usage info.
    help.usage = function () {
        log.header('Usage');
        log.writeln(' ' + path.basename(process.argv[1]) + ' [options] [task [task ...]]');
    };

// Options.
    help.initOptions = function () {
        // Build 2-column array for table view.
        help._options = Object.keys(grunt.cli.optlist).map(function (long) {
            var o = grunt.cli.optlist[long];
            var col1 = '--' + (o.negate ? 'no-' : '') + long + (o.short ? ', -' + o.short : '');
            help.initCol1(col1);
            return [col1, o.info];
        });
    };

    help.options = function () {
        log.header('Options');
        help.table(help._options);
    };

    help.optionsFooter = function () {
        log.writeln().writelns(
                'Options marked with * have methods exposed via the grunt API and should ' +
                'instead be specified inside the Gruntfile wherever possible.'
        );
    };

// Tasks.
    help.initTasks = function () {
        // Initialize task system so that the tasks can be listed.
        grunt.task.init([], {help: true});

        // Build object of tasks by info (where they were loaded from).
        help._tasks = [];
        Object.keys(grunt.task._tasks).forEach(function (name) {
            help.initCol1(name);
            var task = grunt.task._tasks[name];
            help._tasks.push(task);
        });
    };

    help.tasks = function () {
        log.header('Available tasks');
        if (help._tasks.length === 0) {
            log.writeln('(no tasks found)');
        } else {
            help.table(help._tasks.map(function (task) {
                var info = task.info;
                if (task.multi) {
                    info += ' *';
                }
                return [task.name, info];
            }));

            log.writeln().writelns(
                    'Tasks run in the order specified. Arguments may be passed to tasks that ' +
                    'accept them by using colons, like "lint:files". Tasks marked with * are ' +
                    '"multi tasks" and will iterate over all sub-targets if no argument is ' +
                    'specified.'
            );
        }

        log.writeln().writelns(
                'The list of available tasks may change based on tasks directories or ' +
                'grunt plugins specified in the Gruntfile or via command-line options.'
        );
    };

// Footer.
    help.footer = function () {
        log.writeln().writeln('For more information, see http://gruntjs.com/');
    };

};
