"use strict";

module.exports = function (name, flight) {

    return function () {
        // this is flit
        flight.start(this.target.destination);
//        var task = this.tasks[name];
        var status = flight.getStatus();
        if(flight.isAborted()) {
            throw new Error(status.crashRecordings || '');
        }

//        var status = flight.getStatus()
//            , flightNumber = flit.logger.format('%s/%s', i+1, len).magenta
//            , executionTime = prettyTime(status.executionTime).magenta;
//
//        if(flight.isAborted()) {
//            var crashReason = !status.crashRecordings ? ''
//                : flit.logger.format('when %s', status.crashRecordings);
//            flit.logger.error('Flight'.error, flightNumber, 'aborted after'.error
//                , executionTime, crashReason);
//            flit.logger.space();
//            flit.stop();
//        }
//        flit.logger.success('Flight'.success, flightNumber, 'landed after'.success, executionTime);
//        flit.logger.space();
    }
};