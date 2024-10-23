import { concatMap, from, mergeMap, } from 'rxjs'
import { fetchAllGroupProjects$ } from '../src/internals/gitlab/group'
import { cloneProject$, } from '../src/internals/gitlab/project'
import { token } from './token'

const gitLabUrl = 'git.my-company.com'

const groupIds = [
    '123',  
    '3456', 
    '987', 
]

const outdir = '../../temp/outdir'

from(groupIds).pipe(
    concatMap(groupId => {
        return fetchAllGroupProjects$(gitLabUrl, token, groupId).pipe(
            mergeMap((projectCompact) => {
                return cloneProject$(projectCompact, outdir)
            }, 1)
        )
    }),
).subscribe(
    (repo) => {
        console.log(`====>>>> Repo cloned: `, repo)
    }
)