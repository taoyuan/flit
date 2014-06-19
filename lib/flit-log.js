"use strict";

var prettyTime = require('pretty-hrtime');

module.exports = function (flit) {
    var logger = flit.logger;
    var index = 0;

    flit.on('start', function () {
        index = 0;
        logger.info('Flying to'.info
            , '(' + flit.seq.join(',').warn + ')', '->', (flit.target.destination || 'localhost').warn
            , 'with '.info + String(flit.seq.length).magenta + ' flight(s)'.info);
        logger.space();
    });

    flit.on('task_start', function (tinfo) {
        index++;
        logger.info('Flight'.info, logger.format('%s/%s', index, flit.seq.length).magenta
            , ('[' + tinfo.task + ']').warn, 'launched...'.info);
        logger.space();
    });

    flit.on('task_stop', function (tinfo) {
        logger.success('Flight'.success, index, 'landed after'.success, prettyTime(tinfo.hrDuration).magenta);
        logger.space();
    });

    flit.on('task_err', function (tinfo) {
        var err = !tinfo.err ? '' : logger.format('when %s', tinfo.err);
        logger.error('Flight'.error, index, 'aborted after'.error, prettyTime(tinfo.hrDuration).magenta, err);
        logger.space();
    });

    flit.on('err', function () {
        logger.error('Flightplan aborted after'.error, prettyTime(flit.elapse).magenta);
    });

    flit.on('stop', function () {
        logger.success('Flightplan finished after'.success, prettyTime(flit.elapse).magenta);
    });
};