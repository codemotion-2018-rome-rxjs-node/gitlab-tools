
import { writeMultiGroupProjectsToCsv$ } from "../src/apps/write-group-projects/internals/write-group-projects"
import { token } from "./token"


const gitLabUrl = 'git.my-company.com'
const groupIds = [
    '123',  
    '3456', 
    '987', 
]
const outdir = './out'

writeMultiGroupProjectsToCsv$(gitLabUrl, token, groupIds, outdir).subscribe(
    (projects) => {
        console.log(`====>>>> projects read: `, projects)
    },
)