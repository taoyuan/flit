"use strict";

var Q = require('q');
var flit = require('../');
var t = require('chai').assert;

describe('flit/tasks', function () {

    describe('task()', function () {
        it('should define a generic task', function(done) {
            var fn;

            // Arrange
            fn = function() {};

            // Act
            flit.task('test', fn);

            // Assert
            t.ok(flit.tasks.test);
            flit.reset();
            done();
        });

        it('should define a local task', function(done) {
            var fn;

            // Arrange
            fn = function() {};

            // Act
            flit.taskLocal('test', fn);

            // Assert
            t.ok(flit.tasks.test);
            t.isFunction(flit.tasks.test.fn);
            flit.reset();
            done();
        });

    });

    describe('start()', function () {


        it('should start multiple tasks', function (done) {
            var a, fn, fn2;

            // Arrange
            a = 0;
            fn = function () {
                ++a;
            };
            fn2 = function () {
                ++a;
            };
            flit.task('test', fn);
            flit.task('test2', fn2);

            // Act
            flit.start(['test', 'test2']);

            // Assert
            t.equal(a, 2);
            flit.reset();
            done();
        });

        it('should start all tasks when call start() multiple times', function (done) {

            var a, fn, fn2;
            a = 0;
            fn = function () {
                t.equal(this, flit);
                ++a;
            };
            fn2 = function () {
                t.equal(this, flit);
                ++a;
            };
            flit.task('test', fn);
            flit.task('test2', fn2);
            flit.start('test');
            flit.start('test2');
            t.equal(a, 2);
            flit.reset();
            done();
        });

        it('should start all async promise tasks', function (done) {
            var a, fn, fn2;
            a = 0;
            fn = function () {
                var deferred = Q.defer();
                setTimeout(function () {
                    ++a;
                    deferred.resolve();
                }, 1);
                return deferred.promise;
            };
            fn2 = function () {
                var deferred = Q.defer();
                setTimeout(function () {
                    ++a;
                    deferred.resolve();
                }, 1);
                return deferred.promise;
            };
            flit.task('test', fn);
            flit.task('test2', fn2);
            flit.start('test');
            flit.start('test2', function () {
                t.equal(flit.isRunning, false);
                t.equal(a, 2);
                flit.reset();
                done();
            });
            t.equal(flit.isRunning, true);
        });

        it('should start all async callback tasks', function (done) {
            var a, fn, fn2;
            a = 0;
            fn = function (c, cb) {
                setTimeout(function () {
                    ++a;
                    cb(null);
                }, 1);
            };
            fn2 = function (c, cb) {
                setTimeout(function () {
                    ++a;
                    cb(null);
                }, 1);
            };
            flit.task('test', fn);
            flit.task('test2', fn2);
            flit.start('test');
            flit.start('test2', function () {
                t.equal(flit.isRunning, false);
                t.equal(a, 2);
                flit.reset();
                done();
            });
            t.equal(flit.isRunning, true);
        });

        it('should emit task_not_found and throw an error when task is not defined', function (done) {
            flit.on('task_not_found', function (err) {
                t.ok(err);
                t.ok(err.task);
                t.equal(err.task, 'test');
                flit.reset();
                done();
            });
            try {
                flit.start('test');
            } catch (err) {
                t.ok(err);
            }
        });

        it('should start task scoped to flit', function (done) {
            var a, fn;
            a = 0;
            fn = function () {
                t.equal(this, flit);
                ++a;
            };
            flit.task('test', fn);
            flit.start('test');
            t.equal(a, 1);
            t.isFalse(flit.isRunning);
            flit.reset();
            done();
        });

        it('should start default task scoped to flit', function (done) {
            var a, fn;
            a = 0;
            fn = function () {
                t.equal(this, flit);
                ++a;
            };
            flit.task('default', fn);
            flit.start();
            t.equal(a, 1);
            t.equal(flit.isRunning, false);
            flit.reset();
            done();
        });

    });


});