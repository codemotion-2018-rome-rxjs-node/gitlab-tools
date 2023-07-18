import path from "path";
import { toArray, concatMap, map, tap } from "rxjs"
import { fetchAllGroupProjects, readGroup } from "../../../internals/gitlab-functions/group.functions"
import { ProjectCompact } from "../../../internals/gitlab-functions/project.model";
import { toCsv } from "@enrico.piccinin/csv-tools";
import { writeFileObs } from "observable-fs";

export function readGroupProjects(gitLabUrl: string, token: string, groupId: string, outdir: string) {
    let groupName: string

    return readGroup(gitLabUrl, token, groupId).pipe(
        concatMap(group => {
            groupName = group.name
            return fetchAllGroupProjects(gitLabUrl, token, groupId)
        }),
        toArray(),
        concatMap((projects) => {
            const outFile = path.join(outdir, `${groupName}-projects.csv`);
            return writeProjectsCsv(projects, groupName, outFile).pipe(
                map(() => projects)
            )
        }),
    )
}

const writeProjectsCsv = (projects: ProjectCompact[], group: string, outFile: string) => {
    return writeFileObs(outFile, projectsToCsv(projects))
        .pipe(
            tap({
                next: () => console.log(`====>>>> Projects of group ${group} written in csv file: ${outFile}`),
            }),
            map(() => projects)
        );
}
const projectsToCsv = (projects: ProjectCompact[]) => {
    const projectRecs = projects.map(project => {
        let _project: any = {
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
        }
        if (_project.forked_from_project) {
            const forkedFromProjectId = _project.forked_from_project.id
            const forkedFromProjectName = _project.forked_from_project.name
            delete _project.forked_from_project
            _project = { ..._project, forkedFromProjectId, forkedFromProjectName }
        }
        return _project
    })
    return toCsv(projectRecs)
}