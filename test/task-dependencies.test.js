"use strict";

var Flit = require('../').Flit;
var Q = require('q');
var t = require('chai').assert;

describe('flit/task-dependencies', function() {
    describe('run() task dependencies', function() {
        // Technically these are duplicated from require('sequencify'),
        // but those are unit tests and these are integration tests
        it('should run tasks in specified order if no dependencies', function(done) {
            var flit, a, fn, fn2;

            // Arrange
            a = 0;
            fn = function() {
                t.equal(a, 1);
                ++a;
            };
            fn2 = function() {
                t.equal(a, 2);
                ++a;
            };

            // Act
            flit = new Flit();
            flit.on('start', function (e) {
                t.ok(e);
                t.equal(a, 0);
                ++a;
                t.equal(e.message.indexOf('seq: '), 0); // Order is not deterministic, but event should still happen
            });
            flit.add('test1', fn);
            flit.add('test2', fn2);
            flit.start(['test1', 'test2'], function (err) {
                // Assert
                t.equal(a, 3);
                t.notOk(err);
                done();
            });
        });

        it('should run dependency then specified task', function(done) {
            var flit, a, fn, fn2;

            // Arrange
            a = 0;
            fn = function() {
                t.equal(a, 1);
                ++a;
            };
            fn2 = function() {
                t.equal(a, 2);
                ++a;
            };

            // Act
            flit = new Flit();
            flit.on('start', function (e) {
                t.ok(e);
                t.equal(a, 0);
                ++a;
                t.equal(e.message, 'seq: dep,test');
            });
            flit.add('dep', fn);
            flit.add('test', ['dep'], fn2);
            flit.start('test');

            // Assert
            t.equal(a, 3);
            done();
        });

        it('should run asynchronous dependency then specified task', function(done) {
            var flit, a, fn, fn2;

            // Arrange
            a = 0;
            fn = function() {
                var deferred = Q.defer();
                setTimeout(function () {
                    t.equal(a, 1);
                    ++a;
                    deferred.resolve();
                },1);
                return deferred.promise;
            };
            fn2 = function() {
                var deferred = Q.defer();
                setTimeout(function () {
                    t.equal(a, 2);
                    ++a;
                    deferred.resolve();
                },1);
                return deferred.promise;
            };

            // Act
            flit = new Flit();
            flit.on('start', function (e) {
                t.ok(e);
                t.equal(a, 0);
                ++a;
                t.equal(e.message, 'seq: dep,test');
            });
            flit.add('dep', fn);
            flit.add('test', ['dep'], fn2);
            flit.start('test', function () {
                // Assert
                t.equal(flit.isRunning, false);
                t.equal(a, 3);
                done();
            });
            t.equal(flit.isRunning, true);
        });

        it('should run all tasks of complex dependency chain', function(done) {
            var flit, a, fn1, fn2, fn3, fn4, timeout = 2;

            // Arrange
            a = 0;
            // fn1 is a long-running task, fn2 and 3 run quickly, fn4 is synchronous
            // If shorter tasks mark it done before the longer task finishes that's wrong
            fn1 = function() {
                var deferred = Q.defer();
                setTimeout(function () {
                    ++a;
                    deferred.resolve();
                }, timeout*5);
                return deferred.promise;
            };
            fn2 = function() {
                var deferred = Q.defer();
                setTimeout(function () {
                    ++a;
                    deferred.resolve();
                }, timeout);
                return deferred.promise;
            };
            fn3 = function() {
                var deferred = Q.defer();
                setTimeout(function () {
                    ++a;
                    deferred.resolve();
                }, timeout);
                return deferred.promise;
            };
            fn4 = function() {
                ++a;
            };

            // Act
            flit = new Flit();
            flit.on('start', function (e) {
                t.ok(e);
                t.equal(a, 0);
                ++a;
                t.equal(e.message, 'seq: fn1,fn2,fn3,fn4');
            });
            flit.add('fn1', fn1);
            flit.add('fn2', fn2);
            flit.add('fn3', ['fn1', 'fn2'], fn3);
            flit.add('fn4', ['fn3'], fn4);
            flit.start('fn4', function () {
                // Assert
                t.equal(flit.isRunning, false);
                t.equal(a, 5);
                done();
            });
            t.equal(flit.isRunning, true);
        });

    });
});