'use strict';

/**
 * Instantiate miwa.
 */

module.exports = function () {

    // middleware stack.
    var stack = [];

    return {
        use: use,
        handle: handle
    };

    function use(type) {
        // Convert args to array.
        var args = Array.prototype.slice.call(arguments);

        // Check if type not provided.
        if ('string' !== typeof type && type instanceof Array === false) {
            type = [];
        } else {
            if ('string' === typeof type) {
                //wrap string in array to homogenize handling
                type = [type];
            }
            args.shift();
        }

        args.forEach(function(arg){
            stack.push({type: type, cb: arg});
        });

        return this;
    }

    function handle(/* type, ctx, out */) {
        var type, ctx, out, arg;
        var index = 0;
        var ended = false;

        for (var i = 0; i < arguments.length; i++) {
            arg = arguments[i];
            if (!type && typeof arg === 'string') {
                type = arg;
            } else if (!out && typeof arg === 'function') {
                out = arg;
            } else if (!ctx) {
                ctx = arg;
            } else if (arg){
                throw new Error('Unable to recognized parameter:', arg);
            }
        }

        // When called stop middlewares execution.
        ctx.end = end;

        // Handle next middleware in stack.
        function next(err) {
            var middleware = stack[index++];

            // No more middlewares or early end.
            if (!middleware || ended) {
                if (out) out(err, ctx);
                return;
            }

            // Check if middleware type matches or if it has no type.
            if (middleware.type.indexOf(type) === -1 && middleware.type.length > 0) {
                return next(err);
            }

            try {
                var arity = middleware.cb.length;
                //if err, only execute error middlewares
                if (err) {
                    //error middlewares have an arity of 3, the first
                    //arg being the error
                    if (arity === 3) {
                        middleware.cb(err, ctx, next);
                    } else {
                        next(err);
                    }
                } else if (arity < 2) {
                    middleware.cb(ctx);
                    next();
                } else if (arity < 3) {
                    middleware.cb(ctx, next);
                } else {
                    next();
                }
            }
            catch (e) {
                next(e);
            }
        }

        // Stop middlewares execution.
        function end() {
            ended = true;
        }

        // Start handling.
        next();
    }


};