"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.launchClocDiffRepos = void 0;
const commander_1 = require("commander");
const cloc_diff_repos_1 = require("./internals/cloc-diff-repos");
function launchClocDiffRepos() {
    console.log('====>>>> Launching Cloc diff on Repos');
    const { folderPath, outdir, languages } = readParams();
    (0, cloc_diff_repos_1.calculateMonthlyClocDiffsOnRepos)(folderPath, outdir, languages).subscribe();
}
exports.launchClocDiffRepos = launchClocDiffRepos;
function readParams() {
    const program = new commander_1.Command();
    program
        .description('A command to calculate cloc (number of lines of code) of a set of repos contained in a folder')
        .requiredOption('--folderPath <string>', `folder containing the repos to analyze (e.g. ./repos)`)
        .option('--outdir <string>', `directory where the output files will be written (e.g. ./data) - default is the current directory`)
        .option('--languages <string...>', `a space separated list of languages to be considered in the diff (e.g. --languages "Java" "Python")
             - default is the empty list which means all languages`);
    const _options = program.parse(process.argv).opts();
    const outdir = _options.outdir || process.cwd();
    const languages = _options.languages || [];
    return { folderPath: _options.folderPath, outdir, languages };
}
//# sourceMappingURL=launch-cloc-diff-repos.js.map