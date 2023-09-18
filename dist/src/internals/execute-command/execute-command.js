"use strict";
// https://gist.github.com/wosephjeber/212f0ca7fea740c3a8b03fc2283678d3
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeCommandInShellNewProcessObs = exports.executeCommandNewProcessToLinesObs = exports.executeCommandNewProcessObs = exports.executeCommandObs = exports.executeCommand = void 0;
var child_process_1 = require("child_process");
var rxjs_1 = require("rxjs");
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function executeCommand(action, command) {
    console.log("====>>>> Action: ".concat(action, " -- Executing command"));
    console.log("====>>>> ".concat(command));
    var ret = (0, child_process_1.execSync)(command)
        .toString('utf8')
        .replace(/[\n\r\s]+$/, '');
    console.log("====>>>> Command executed successfully");
    return ret;
}
exports.executeCommand = executeCommand;
function executeCommandObs(action, command) {
    return new rxjs_1.Observable(function (subscriber) {
        console.log("====>>>> Action: ".concat(action, " -- Executing command with Observable"));
        console.log("====>>>> ".concat(command));
        (0, child_process_1.exec)(command, function (error, stdout, stderr) {
            if (error) {
                subscriber.error(error);
                return;
            }
            if (stderr.length > 0) {
                subscriber.next("from stderr: ".concat(stderr));
            }
            if (stdout.length > 0) {
                subscriber.next("from stdout: ".concat(stdout));
            }
            if (stdout.length === 0 && stderr.length === 0) {
                subscriber.next("no message on stdout or stderr");
            }
            console.log("====>>>> Command ".concat(command, " executed successfully"));
            subscriber.complete();
        });
    });
}
exports.executeCommandObs = executeCommandObs;
function executeCommandNewProcessObs(action, command, args, options) {
    return new rxjs_1.Observable(function (subscriber) {
        console.log("====>>>> Action: ".concat(action, " -- Executing command in new process"));
        console.log("====>>>> Command: ".concat(command));
        console.log("====>>>> Arguments: ".concat(args.join(' ')));
        if (options) {
            console.log("====>>>> Options: ".concat(JSON.stringify(options)));
        }
        var cmd = (0, child_process_1.spawn)(command, args.filter(function (a) { return a.length > 0; }), options);
        cmd.stdout.on('data', function (data) {
            subscriber.next(data);
        });
        cmd.stderr.on('data', function (data) {
            console.log("msg on stderr for command ".concat(command), data.toString());
        });
        cmd.on('error', function (error) {
            subscriber.error(error);
        });
        cmd.on('close', function (code) {
            subscriber.complete();
            console.log("====>>>> Command ".concat(command, " with args ").concat(args, " executed - exit code ").concat(code));
        });
    });
}
exports.executeCommandNewProcessObs = executeCommandNewProcessObs;
// executes a command in a separate process and returns an Observable which is the stream of lines output of the command execution
function executeCommandNewProcessToLinesObs(action, command, args, options) {
    return executeCommandNewProcessObs(action, command, args, options).pipe(bufferToLines());
}
exports.executeCommandNewProcessToLinesObs = executeCommandNewProcessToLinesObs;
// custom operator that converts a buffer to lines, i.e. splits on \n to emit each line
function bufferToLines() {
    return function (source) {
        return new rxjs_1.Observable(function (subscriber) {
            var remainder = '';
            var subscription = source.subscribe({
                next: function (buffer) {
                    var bufferWithRemainder = "".concat(remainder).concat(buffer);
                    var lines = bufferWithRemainder.toString().split('\n');
                    remainder = lines.splice(lines.length - 1)[0];
                    lines.forEach(function (l) { return subscriber.next(l); });
                },
                error: function (err) { return subscriber.error(err); },
                complete: function () {
                    subscriber.next(remainder);
                    subscriber.complete();
                },
            });
            return function () {
                subscription.unsubscribe();
            };
        });
    };
}
function executeCommandInShellNewProcessObs(action, command, options) {
    var _options = __assign(__assign({}, options), { shell: true });
    return executeCommandNewProcessObs(action, command, [], _options);
}
exports.executeCommandInShellNewProcessObs = executeCommandInShellNewProcessObs;
