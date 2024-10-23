import { mergeMap, } from 'rxjs'
import { fetchAllGroupProjects$ } from '../src/internals/gitlab/group'
import { cloneProject$, } from '../src/internals/gitlab/project'
import { token } from './token'
import { CONFIG } from '../src/internals/config'

const gitLabUrl = 'git.my-company.com'
const groupId = '7743'
const outdir = '../../temp/outdir'

fetchAllGroupProjects$(gitLabUrl, token, groupId).pipe(
    mergeMap((projectCompact) => {
        return cloneProject$(projectCompact, outdir)
    }, CONFIG.CONCURRENCY)
).subscribe(
    (repo) => {
        console.log(`====>>>> Repo cloned: `, repo)
    }
)