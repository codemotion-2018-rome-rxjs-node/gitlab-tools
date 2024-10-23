import { fetchGroupDescendantGroups } from '../src/internals/gitlab/group'
import { token } from './token'

const gitLabUrl = 'git.my-company.com'
const groupId = '241'

fetchGroupDescendantGroups(gitLabUrl, token, groupId).subscribe(
    (descendants) => {
        console.log(`====>>>> Descendants groups read`)
        descendants.map((d: any) => d.full_path).sort().forEach((descendant: any) => {
            console.log(`${descendant}`)
        })
    },
)