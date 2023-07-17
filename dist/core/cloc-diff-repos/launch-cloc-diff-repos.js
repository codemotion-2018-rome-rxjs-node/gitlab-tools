"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.launchClocDiffRepos = void 0;
const commander_1 = require("commander");
const cloc_diff_repos_1 = require("./internals/cloc-diff-repos");
function launchClocDiffRepos() {
    console.log('====>>>> Launching Cloc diff on Repos');
    const { folderPath, outdir, languages, from, to } = readParams();
    (0, cloc_diff_repos_1.calculateMonthlyClocDiffsOnRepos)(folderPath, outdir, languages, from, to).subscribe();
}
exports.launchClocDiffRepos = launchClocDiffRepos;
function readParams() {
    const program = new commander_1.Command();
    program
        .description('A command to calculate cloc (number of lines of code) of a set of repos contained in a folder')
        .requiredOption('--folderPath <string>', `folder containing the repos to analyze (e.g. ./repos)`)
        .option('--outdir <string>', `directory where the output files will be written (e.g. ./data) - default is the current directory`)
        .option('--languages <string...>', `a space separated list of languages to be considered in the diff (e.g. --languages "Java" "Python")
             - default is the empty list which means all languages`)
        .option('--from <string>', `the date from which we start the analysis - default is the beginning of the Unix epoch, i.e. 1970-01-01`)
        .option('--to <string>', `the date until which we run the analysis - default is the current date`);
    const _options = program.parse(process.argv).opts();
    const outdir = _options.outdir || process.cwd();
    const languages = _options.languages || [];
    const from = _options.from ? new Date(_options.from) : new Date(0);
    const to = _options.to ? new Date(_options.to) : new Date(Date.now());
    return { folderPath: _options.folderPath, outdir, languages, from, to };
}
//# sourceMappingURL=launch-cloc-diff-repos.js.map