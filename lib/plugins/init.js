"use strict";

module.exports = function (c) {

    c.logger.enableDebug('debug' in c.options ? c.options.debug : c.config('debug'));
};