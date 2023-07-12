"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.launchMergeRequestAnalysis = void 0;
const path_1 = __importDefault(require("path"));
const commander_1 = require("commander");
const rxjs_1 = require("rxjs");
const xlsx_1 = __importDefault(require("xlsx"));
const read_merge_requests_1 = require("./internals/read-merge-requests");
const to_excel_1 = require("./internals/to-excel");
const read_group_1 = require("./internals/read-group");
function launchMergeRequestAnalysis() {
    console.log('====>>>> Launching Merge Request Analysis');
    const { _gitLabUrl, _token, _groupId, _outdir } = readParams();
    let _name;
    (0, read_group_1.readGroup)(_gitLabUrl, _token, _groupId).pipe((0, rxjs_1.concatMap)(group => {
        _name = group.name;
        return (0, read_merge_requests_1.runMergeRequestAnalysis)(_gitLabUrl, _token, _groupId);
    }), (0, rxjs_1.map)(analysis => {
        return (0, to_excel_1.analysisToExcel)(analysis);
    }), (0, rxjs_1.tap)((workbook) => {
        const fileName = path_1.default.join(_outdir, `${_name}.xls`);
        xlsx_1.default.writeFile(workbook, fileName);
        console.log(`====>>>> Workbook written ${fileName}`);
    })).subscribe();
}
exports.launchMergeRequestAnalysis = launchMergeRequestAnalysis;
function readParams() {
    const program = new commander_1.Command();
    program
        .description('A command to analyze the merge requests of a gitlab group')
        .requiredOption('--gitLabUrl <string>', `gitlab server (e.g. gitlab.example.com)`)
        .requiredOption('--token <string>', `private token to access the gitlab api (e.g. abcde-Abcde1GhijKlmn2Opqrs)`)
        .requiredOption('--groupId <string>', `id of the group to analyze (e.g. 1234)`)
        .option('--outdir <string>', `directory where the output files will be written (e.g. ./data) - default is the current directory`);
    const _options = program.parse(process.argv).opts();
    const _outdir = _options.outdir || process.cwd();
    return { _gitLabUrl: _options.gitLabUrl, _token: _options.token, _groupId: _options.groupId, _outdir };
}
//# sourceMappingURL=exec-command.js.map