import path from "path";
import { toArray, concatMap, map, tap, from } from "rxjs"
import { fetchAllGroupProjects, readGroup } from "../../../internals/gitlab-functions/group.functions"
import { ProjectCompact } from "../../../internals/gitlab-functions/project.model";
import { toCsv } from "@enrico.piccinin/csv-tools";
import { writeFileObs } from "observable-fs";

export function writeGroupProjectsToCsv$(gitLabUrl: string, token: string, groupId: string, outdir: string) {
    let groupName: string

    return readGroup(gitLabUrl, token, groupId).pipe(
        concatMap(group => {
            groupName = group.name
            return fetchAllGroupProjects(gitLabUrl, token, groupId)
        }),
        toArray(),
        concatMap((projects) => {
            const outFile = path.join(outdir, `${groupName}-projects.csv`);
            return writeProjectsCsv(projects, [groupName], outFile).pipe(
                map(() => projects)
            )
        }),
    )
}

export function readMultiGroupProjectsToCsv$(gitLabUrl: string, token: string, groupIds: string[]) {
    let groupNames: string[] = []
    return from(groupIds).pipe(
        concatMap(groupId => readGroup(gitLabUrl, token, groupId)),
        concatMap(group => {
            groupNames.push(group.name)
            return fetchAllGroupProjects(gitLabUrl, token, group.id.toString())
        }),
        toArray(),
    )
}

export function writeProjectsToCsv$(projects: any[], groupIds: string[], outdir: string) {
    let groupNames: string[] = []
    const outFile = path.join(outdir, `${groupIds.join('-')}-groups-projects.csv`);
    return writeProjectsCsv(projects, groupNames, outFile).pipe(
        map(() => projects)
    )
}

export function writeMultiGroupProjectsToCsv$(gitLabUrl: string, token: string, groupIds: string[], outdir: string) {
    return readMultiGroupProjectsToCsv$(gitLabUrl, token, groupIds).pipe(
        concatMap((projects) => {
            return writeProjectsToCsv$(projects, groupIds, outdir)
        }),
    )
}

// export function enrichProjects(projects: ProjectCompact[]) {
//     const projectDict: { [id: string]: ProjectCompact } = {}
//     projects.forEach(project => {
//         projectDict[project.id.toString()] = project
//     })
//     return projects.map(project => {
//         const fork_origin_id
// }

export function _writeMultiGroupProjectsToCsv$(gitLabUrl: string, token: string, groupIds: string[], outdir: string) {
    let groupNames: string[] = []
    return from(groupIds).pipe(
        concatMap(groupId => readGroup(gitLabUrl, token, groupId)),
        concatMap(group => {
            groupNames.push(group.name)
            return fetchAllGroupProjects(gitLabUrl, token, group.id.toString())
        }),
        toArray(),
        concatMap((projects) => {
            const outFile = path.join(outdir, `${groupIds.join('-')}-groups-projects.csv`);
            return writeProjectsCsv(projects, groupNames, outFile).pipe(
                map(() => projects)
            )
        }),
    )
}

const writeProjectsCsv = (projects: ProjectCompact[], groups: string[], outFile: string) => {
    return writeFileObs(outFile, projectsToCsv(projects))
        .pipe(
            tap({
                next: () => console.log(`====>>>> Projects of group ${groups.join(', ')} written in csv file: ${outFile}`),
            }),
            map(() => projects)
        );
}
const projectsToCsv = (projects: ProjectCompact[]) => {
    const projectRecs = projects.map(project => {
        let _project: any = {
            id: project.id,
            name: project.name,
            // print the description in a single line without \n and \r characters
            description: project.description ? project.description.replace(/(\r\n|\n|\r)/gm, ' ') : '',
            name_with_namespace: project.name_with_namespace,
            path: project.path,
            path_with_namespace: project.path_with_namespace,
            ssh_url_to_repo: project.ssh_url_to_repo,
            http_url_to_repo: project.http_url_to_repo,
            web_url: project.web_url,
            created_at: project.created_at,
            last_activity_at: project.last_activity_at,
            updated_at: project.updated_at,
            parentGroup: project.path_with_namespace.split('/')[0],
            forkedFromProjectId: '-',
            forkedFromProjectName: '-',
            forkedFromProjectUrl: '-',
            forkedFromProjectPathWithNamespace: '-',
            forkedFromProjectParentGroup: '-',
        }
        if (project.forked_from_project) {
            _project.forkedFromProjectId = project.forked_from_project.id
            _project.forkedFromProjectName = project.forked_from_project.name
            _project.forkedFromProjectUrl = project.forked_from_project.http_url_to_repo
            _project.forkedFromProjectPathWithNamespace = project.forked_from_project.path_with_namespace
            _project.forkedFromProjectParentGroup = _project.forkedFromProjectPathWithNamespace.split('/')[0]
        }
        return _project
    })
    return toCsv(projectRecs)
}
