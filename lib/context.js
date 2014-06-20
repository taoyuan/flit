"use strict";

module.exports = Context;

function Context(flit) {
    if (!(this instanceof Context)) {
        return new Context(flit);
    }
    this.flit = flit;
    this.logger = flit.logger;
    this.config = flit.config;
}