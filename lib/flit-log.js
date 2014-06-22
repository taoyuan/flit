"use strict";

var prettyTime = require('pretty-hrtime');
var chalk = require('chalk');
var util = require('util');

module.exports = function (flit) {
    var logger = flit.logger;
    var index = 0;

    flit.on('start', function () {
        index = 0;
        logger.info(chalk.info('Starting')
            , chalk.warn('(' + flit.seq.join(',') + ')'), '->', chalk.warn(flit.ctx.destination || 'localhost')
            , chalk.info('with ') + chalk.magenta(String(flit.seq.length)) + chalk.info(' task(s)'));
        logger.space();
    });

    flit.on('task_start', function (tinfo) {
        index++;
        logger.info(chalk.info('Task'), logger.format(chalk.magenta('%s/%s'), index, flit.seq.length)
            , chalk.warn('[' + tinfo.task + ']'), chalk.info('launched...'));
        logger.space();
    });

    flit.on('task_stop', function (tinfo) {
        logger.success(chalk.success('Task'), index, chalk.success('executed after'), chalk.magenta(prettyTime(tinfo.hrDuration)));
        logger.space();
    });

    flit.on('task_err', function (tinfo) {
        var err = !tinfo.err ? '' : logger.format('when %s', tinfo.err);
        logger.error(chalk.error('Task'), index, chalk.error('aborted after'), chalk.magenta(prettyTime(tinfo.hrDuration)), err);
        logger.space();
    });

    flit.on('err', function (err) {
        if (err && ~err.message.indexOf('failed')) {
            logger.error(chalk.error('Execution failed:'), err.err);
        } else {
            logger.error(chalk.error('Execution aborted' + (flit.elapse ? ' after' : '')), chalk.magenta(prettyTime(flit.elapse)));
        }
    });

    flit.on('stop', function () {
        logger.success(chalk.success('Execution finished' + (flit.elapse ? ' after' : '')), chalk.magenta(prettyTime(flit.elapse)));
    });
};