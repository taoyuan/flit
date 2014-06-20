'use strict';

var _ = require('lodash');

// Get/set config data. If value was passed, set. Otherwise, get.
module.exports = function () {

    function config(prop, value) {
        if (arguments.length === 2) {
            // Two arguments were passed, set the property's value.
            return config.set(prop, value);
        } else {
            // Get the property's value (or the entire data object).
            return config.get(prop);
        }
    }

// The actual config data.
    config.data = {};

// Escape any . in name with \. so dot-based namespacing works properly.
    config.escape = function (str) {
        return str.replace(/\./g, '\\.');
    };

// Return prop as a string.
    config.getPropString = function (prop) {
        return Array.isArray(prop) ? prop.map(config.escape).join('.') : prop;
    };

// Get config data, recursively processing templates.
    config.get = function (prop) {
        if (prop) {
            // Prop was passed, get that specific property's value.
            return config.data[prop];
        } else {
            // No prop was passed, return the entire config.data object.
            return config.data;
        }
    };

    // Set config data.
    config.set = function (prop, value) {
        return config.data[prop] = value;
    };

    // Deep merge config data.
    config.merge = function (obj) {
        _.merge(config.data, obj);
        return config.data;
    };

    // Initialize config data.
    config.init = function (obj) {
        // Initialize and return data.
        return (config.data = obj || {});
    };

    return config;
};
