import axios from "axios"
import { from, map } from "rxjs"

import { ProjectCompact } from "./project.model"
import { cloneRepo } from "../git-functions/clone-repo"
import path from "path"

export function readProject(gitLabUrl: string, token: string, projectId: string) {
    const command = `https://${gitLabUrl}/api/v4/projects/${projectId}`
    return from(axios.get(command, {
        headers: {
            "PRIVATE-TOKEN": token
        }
    })).pipe(
        map(resp => {
            return resp.data as ProjectCompact
        })
    )
}

export function cloneProject(project: ProjectCompact, outdir: string) {
    const url = project.ssh_url_to_repo;
    const name = project.name_with_namespace;

    if (!url) throw new Error(`No url for repo ${JSON.stringify(project, null, 2)}`);
    if (!name) throw new Error(`No name for repo ${url}`);

    const directory = dirFromNameWithNameSpace(name);
    const outDirPath = path.join(outdir, directory);

    return cloneRepo(project.ssh_url_to_repo!, outDirPath, project.name)
}

function dirFromNameWithNameSpace(pathParts: string) {
    return pathParts.split(' / ').join(path.sep);
}