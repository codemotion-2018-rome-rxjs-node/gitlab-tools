"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.launchReadGroupProjects = void 0;
const commander_1 = require("commander");
const read_group_projects_1 = require("./internals/read-group-projects");
function launchReadGroupProjects() {
    console.log('====>>>> Launching Read Group Projects');
    const { gitLabUrl, token, groupId, outdir } = readParams();
    (0, read_group_projects_1.readGroupProjects)(gitLabUrl, token, groupId, outdir).subscribe();
}
exports.launchReadGroupProjects = launchReadGroupProjects;
function readParams() {
    const program = new commander_1.Command();
    program
        .description('A command to read all the projects of a gitlab group')
        .requiredOption('--gitLabUrl <string>', `gitlab server (e.g. gitlab.example.com)`)
        .requiredOption('--token <string>', `private token to access the gitlab api (e.g. abcde-Abcde1GhijKlmn2Opqrs)`)
        .requiredOption('--groupId <string>', `id of the group to read (e.g. 1234)`)
        .option('--outdir <string>', `directory where the output files will be written (e.g. ./data) - default is the current directory`);
    const _options = program.parse(process.argv).opts();
    const outdir = _options.outdir || process.cwd();
    return { gitLabUrl: _options.gitLabUrl, token: _options.token, groupId: _options.groupId, outdir };
}
//# sourceMappingURL=launch-read-group-projects.js.map