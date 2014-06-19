"use strict";

var Flight = require('flightplan/lib/flight');

Flight.prototype.abort = function (msg) {
    this.status.aborted = true;
    this.status.crashRecordings = msg;
};