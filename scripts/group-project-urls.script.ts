import { fetchAllGroupProjects$ } from '../src/internals/gitlab/group'
import { token } from './token'

const gitLabUrl = 'git.my-company.com'
const groupId = '9780'

fetchAllGroupProjects$(gitLabUrl, token, groupId).subscribe(
    (projectCompact) => {
        console.log(`====>>>> Project url`, projectCompact.ssh_url_to_repo)
    },
)