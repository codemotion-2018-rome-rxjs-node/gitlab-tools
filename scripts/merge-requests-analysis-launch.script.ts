import { launchAnalyzeMergRequestInternal } from "../src/apps/analyze-merge-requests/internals/launch-analyze-merge-requests"
import { token } from './token'

const gitLabUrl = 'git.my-company.com'
const groupId = '573'
const outdir = './out'

launchAnalyzeMergRequestInternal(gitLabUrl, token, groupId, outdir).subscribe(
    (analysis: any) => {
        console.log(`====>>>> Analysis completed`, analysis)
    },
)