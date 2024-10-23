import { token } from './token'
import { writeCompareForksInGroupToCsv$ } from "../src/internals/gitlab/compare-forks";

const gitLabUrl = 'git.my-company.com'
const groupId = '7743'
const outdir = 'temp'

writeCompareForksInGroupToCsv$(gitLabUrl, token, groupId, outdir)
.subscribe()
