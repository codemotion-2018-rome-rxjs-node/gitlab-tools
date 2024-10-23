import { fetchAllGroupProjects$ } from '../src/internals/gitlab/group'
import { token } from './token'

const gitLabUrl = 'git.my-company.com'
const groupId = '241'

fetchAllGroupProjects$(gitLabUrl, token, groupId).subscribe(
    (projects) => {
        console.log(`====>>>> Projects read`, projects)
    },
)