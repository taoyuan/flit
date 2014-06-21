"use strict";

module.exports = function (flit) {

    flit.tools.debug = {
        alias: 'd',
        flag: true,
        desc: 'Enable debugging mode for tasks that support it.'
    };

    return function (c) {
        c.logger.enableDebug('debug' in c.options ? c.options.debug : c.config('debug'));
    };
};