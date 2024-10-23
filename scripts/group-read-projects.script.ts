
import { writeGroupProjectsToCsv$ } from "../src/apps/write-group-projects/internals/write-group-projects"
import { token } from "./token"


const gitLabUrl = 'git.my-company.com'
const groupId = '114'
const outdir = './out'

writeGroupProjectsToCsv$(gitLabUrl, token, groupId, outdir).subscribe(
    (projects) => {
        console.log(`====>>>> projects read: `, projects)
    },
)