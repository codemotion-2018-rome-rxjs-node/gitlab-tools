"use strict";
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
exports.noDiffsClocDiffStats = void 0;
function noDiffsClocDiffStats(languages) {
    return languages.reduce(function (acc, lang) {
        var clocDiffLanguageStats = {};
        clocDiffLanguageStats[lang] = {
            nFiles: 0,
            blank: 0,
            comment: 0,
            code: 0,
        };
        acc.diffs.added = __assign({}, clocDiffLanguageStats);
        acc.diffs.removed = __assign({}, clocDiffLanguageStats);
        acc.diffs.modified = __assign({}, clocDiffLanguageStats);
        acc.diffs.same = __assign({}, clocDiffLanguageStats);
        return acc;
    }, {
        diffs: {
            same: {},
            modified: {},
            added: {},
            removed: {},
        }
    });
}
exports.noDiffsClocDiffStats = noDiffsClocDiffStats;
