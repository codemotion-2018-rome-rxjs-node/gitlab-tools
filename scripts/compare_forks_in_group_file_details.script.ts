import { token } from './token'
import { writeCompareForksWithFileDetailsInGroupToCsv$ } from "../src/internals/gitlab/compare-forks";

const gitLabUrl = 'git.my-company.com'
const groupId = '7743'
const outdir = 'temp'

writeCompareForksWithFileDetailsInGroupToCsv$(gitLabUrl, token, groupId, outdir)
.subscribe()
