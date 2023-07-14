"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloneGroupProjects = void 0;
const rxjs_1 = require("rxjs");
const group_functions_1 = require("../../../internals/gitlab-functions/group.functions");
const project_functions_1 = require("../../../internals/gitlab-functions/project.functions");
const config_1 = require("../../../internals/config");
function cloneGroupProjects(gitLabUrl, token, groupId, outdir) {
    let numProject = 0;
    return (0, group_functions_1.fetchAllGroupProjects)(gitLabUrl, token, groupId).pipe((0, rxjs_1.tap)(projects => {
        numProject = projects.length;
        console.log(`====>>>> number of projects read`, numProject);
    }), (0, rxjs_1.concatMap)(projects => projects), (0, rxjs_1.mergeMap)((project) => {
        return (0, project_functions_1.readProject)(gitLabUrl, token, project.id);
    }, config_1.CONFIG.CONCURRENCY), (0, rxjs_1.mergeMap)((projectCompact) => {
        return (0, project_functions_1.cloneProject)(projectCompact, outdir);
    }, config_1.CONFIG.CONCURRENCY), (0, rxjs_1.toArray)(), (0, rxjs_1.tap)(repos => {
        console.log(`====>>>> cloned ${repos.length} repos in folder ${outdir}`);
        console.log(`====>>>> FAILED to clone ${numProject - repos.length} repos`);
    }));
}
exports.cloneGroupProjects = cloneGroupProjects;
//# sourceMappingURL=clone-group-projects.js.map