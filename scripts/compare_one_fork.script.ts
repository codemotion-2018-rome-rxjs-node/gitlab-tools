import { compareForkFromLastTagOrDefaultBranch$ } from "../src/internals/gitlab/compare-forks";
import { token } from './token'

const gitLabUrl = 'git.my-company.com'
const projectId = '8830'

compareForkFromLastTagOrDefaultBranch$(gitLabUrl, token, projectId)
.subscribe((compareResult) => {
    console.log(`====>>>> result`, compareResult)
})
