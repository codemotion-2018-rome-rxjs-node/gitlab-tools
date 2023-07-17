"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.noDiffsClocDiffStats = void 0;
function noDiffsClocDiffStats(languages) {
    return languages.reduce((acc, lang) => {
        const clocDiffLanguageStats = {};
        clocDiffLanguageStats[lang] = {
            nFiles: 0,
            blank: 0,
            comment: 0,
            code: 0,
        };
        acc.diffs.added = Object.assign({}, clocDiffLanguageStats);
        acc.diffs.removed = Object.assign({}, clocDiffLanguageStats);
        acc.diffs.modified = Object.assign({}, clocDiffLanguageStats);
        acc.diffs.same = Object.assign({}, clocDiffLanguageStats);
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
//# sourceMappingURL=cloc-diff.model.js.map