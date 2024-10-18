import path from "path"
import { filter, map, forkJoin, concatMap, toArray, tap } from "rxjs"

import { writeFileObs } from "observable-fs";
import { toCsvObs } from "@enrico.piccinin/csv-tools";

import { compareProjects$, readProject$ } from "./project"
import { getTags } from "./tags"
import { fetchAllGroupProjects$, readGroup$ } from "./group"



//********************************************************************************************************************** */
//****************************   APIs                               **************************************************** */
//********************************************************************************************************************** */

export function compareForksInGroup$(gitLabUrl: string, token: string, groupId: string) {
    let count = 0
    return fetchAllGroupProjects$(gitLabUrl, token, groupId).pipe(
        filter(project => {
            return project.forked_from_project !== undefined
        }),
        concatMap(project => {
            count += 1
            console.log(`====>>>> Analyzing project ${project.name_with_namespace}`)
            return compareForkFromLastTagOrDefaultBranch$(gitLabUrl, token, project.id.toString())
        }),
        tap({
            complete: () => {
                console.log(`====>>>> Total number of for projects analyzed`, count)
            }
        })
    )
}

export function writeCompareForksInGroupToCsv$(gitLabUrl: string, token: string, groupId: string, outdir: string) {
    let groupName: string

    return readGroup$(gitLabUrl, token, groupId).pipe(
        concatMap(group => {
            groupName = group.name
            return compareForksInGroup$(gitLabUrl, token, groupId)
        }),
        toCsvObs(),
        toArray(),
        concatMap((compareResult) => {
            const outFile = path.join(outdir, `${groupName}-compare-result.csv`);
            return writeCompareResultsToCsv$(compareResult, groupName, outFile)
        }),
    )
}

//********************************************************************************************************************** */
//****************************               Internals              **************************************************** */
//********************************************************************************************************************** */
// these functions may be exported for testing purposes


export function compareForkFromLastTagOrDefaultBranch$(gitLabUrl: string, token: string, projectId: string) {
    const projectdata$ = readProject$(gitLabUrl, token, projectId).pipe(
        filter(project => {
            if (project.forked_from_project === undefined) {
                console.error(`====>>>> Error: project ${project.name_with_namespace} is not a fork`)
                return false
            }
            return project.forked_from_project !== undefined
        }),
        map(project => {
            const upstream = project.forked_from_project
            const resp = {
                project_name: project.name,
                project_name_with_namespace: project.name_with_namespace,
                project_id: project.id,
                default_branch: project.default_branch,
                created_at: project.created_at,
                updated_at: project.updated_at,
                upstream_repo: upstream,
                upstream_repo_name: upstream?.name_with_namespace,
                upstream_repo_id: upstream?.id,
                upstream_repo_default_branch: upstream?.default_branch,
                upstream_repo_forks_count: upstream?.forks_count
            }
            return resp
        }),
    )
    
    const lastTag$ = getTags(gitLabUrl, token, projectId).pipe(
        map(tags => {
            if (tags.length === 0) {
                return null
            }
            return tags[0]
        })
    )
    
    return forkJoin([projectdata$, lastTag$]).pipe(
        map(([projectData, lastTag]) => {
            const lastTagName = lastTag ? lastTag.name : projectData.default_branch
            return {projectData, lastTagName}
        }),
        filter(({projectData, lastTagName}) => {
            if (lastTagName === undefined || projectData.upstream_repo_default_branch === undefined) {
                console.error(`====>>>> Error: lastTagName or upstream_repo_default_branch for project ${projectData.project_name} is undefined. LastTagName: ${lastTagName}, upstream_repo_default_branch: ${projectData.upstream_repo_default_branch}`)
                return false
            }
            return true
        }),
        concatMap(({projectData, lastTagName}) => {
            const from_fork_to_upstream$ = compareProjects$(
                gitLabUrl,
                token,
                projectData.project_id.toString(),
                lastTagName,
                projectData.upstream_repo_id!,
                projectData.upstream_repo_default_branch!
            )
            const from_upstream_to_fork$ = compareProjects$(
                gitLabUrl,
                token,
                projectData.upstream_repo_id!,
                projectData.upstream_repo_default_branch!,
                projectData.project_id.toString(),
                lastTagName
            )
            return forkJoin([from_fork_to_upstream$, from_upstream_to_fork$]).pipe(
                map(([from_fork_to_upstream, from_upstream_to_fork]) => {
                    return {from_fork_to_upstream, from_upstream_to_fork, projectData, lastTagName}
                })
            )
        }),
        map(({from_fork_to_upstream, from_upstream_to_fork, projectData, lastTagName}) => {
            const num_commits_ahead = from_upstream_to_fork.commits.length
            const num_commits_behind = from_fork_to_upstream.commits.length
            // build the url for GitLab that shows the commits ahead and behind for the forked project, a url like, for instance:
            // "https://git.ad.rgigroup.com/iiab/temporary_forks/payload-builder-core/-/tree/payload-builder-core-310.3.4?ref_type=tags"
            let ahead_behind_commits_url = '---'
            const from_upstream_fork_url = from_upstream_to_fork.web_url
            // check that there is a '/-/' in the url
            if (!from_upstream_fork_url.includes('/-/')) {
                console.error(`====>>>> Error: from_upstream_fork_url ${from_upstream_fork_url} does not contain '/-/'`)
            } else {
                const from_upstream_fork_url_parts = from_upstream_fork_url.split('-')
                const base_part = from_upstream_fork_url_parts[0]
                ahead_behind_commits_url = `${base_part}-/tree/${lastTagName}?ref_type=tags`
            }
            return {
                project_name: projectData.project_name_with_namespace,
                tag_name: lastTagName,
                upstream_repo_name: projectData.upstream_repo_name,
                num_commits_ahead,
                num_commits_behind,
                created: projectData.created_at,
                updated: projectData.updated_at,
                project_id: projectData.project_id,
                upstream_repo_forks_count: projectData.upstream_repo_forks_count,
                web_url_from_upstream_to_fork: from_upstream_to_fork.web_url,
                web_url_from_fork_to_upstream: from_fork_to_upstream.web_url,
                ahead_behind_commits_url: ahead_behind_commits_url
            }
        })
    )
}

const writeCompareResultsToCsv$ = (compareResults: any[], group: string, outFile: string) => {
    return writeFileObs(outFile, compareResults)
        .pipe(
            tap({
                next: () => console.log(`====>>>> Fork compare result for Group ${group} written in csv file: ${outFile}`),
            }),
        );
}