"use strict";

module.exports = function (flit) {
    var start;

    flit.on('reset', function () {
        start = undefined;
        flit.elapse = null;
    });

    flit.on('start', function () {
        markStart();
    });

    flit.on('err', function () {
        markEnd();
    });

    flit.on('stop', function () {
        markEnd();
    });

    function markStart() {
        start = process.hrtime();
    }

    function markEnd() {
        flit.elapse = start ? process.hrtime(start) : 0;
    }
};