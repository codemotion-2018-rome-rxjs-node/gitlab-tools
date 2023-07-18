"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readGroupProjects = void 0;
const path_1 = __importDefault(require("path"));
const rxjs_1 = require("rxjs");
const group_functions_1 = require("../../../internals/gitlab-functions/group.functions");
const csv_tools_1 = require("@enrico.piccinin/csv-tools");
const observable_fs_1 = require("observable-fs");
function readGroupProjects(gitLabUrl, token, groupId, outdir) {
    let groupName;
    return (0, group_functions_1.readGroup)(gitLabUrl, token, groupId).pipe((0, rxjs_1.concatMap)(group => {
        groupName = group.name;
        return (0, group_functions_1.fetchAllGroupProjects)(gitLabUrl, token, groupId);
    }), (0, rxjs_1.toArray)(), (0, rxjs_1.concatMap)((projects) => {
        const outFile = path_1.default.join(outdir, `${groupName}-projects.csv`);
        return writeProjectsCsv(projects, groupName, outFile).pipe((0, rxjs_1.map)(() => projects));
    }));
}
exports.readGroupProjects = readGroupProjects;
const writeProjectsCsv = (projects, group, outFile) => {
    return (0, observable_fs_1.writeFileObs)(outFile, projectsToCsv(projects))
        .pipe((0, rxjs_1.tap)({
        next: () => console.log(`====>>>> Projects of group ${group} written in csv file: ${outFile}`),
    }), (0, rxjs_1.map)(() => projects));
};
const projectsToCsv = (projects) => {
    const projectRecs = projects.map(project => {
        let _project = {
            id: project.id,
            name: project.name,
            description: project.description,
            name_with_namespace: project.name_with_namespace,
            path: project.path,
            path_with_namespace: project.path_with_namespace,
            ssh_url_to_repo: project.ssh_url_to_repo,
            http_url_to_repo: project.http_url_to_repo,
            web_url: project.web_url,
            created_at: project.created_at,
            forked_from_project: project.forked_from_project
        };
        if (_project.forked_from_project) {
            const forkedFromProjectId = _project.forked_from_project.id;
            const forkedFromProjectName = _project.forked_from_project.name;
            delete _project.forked_from_project;
            _project = Object.assign(Object.assign({}, _project), { forkedFromProjectId, forkedFromProjectName });
        }
        return _project;
    });
    return (0, csv_tools_1.toCsv)(projectRecs);
};
//# sourceMappingURL=read-group-projects.js.map