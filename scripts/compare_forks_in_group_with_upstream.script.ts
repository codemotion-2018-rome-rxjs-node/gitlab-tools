import { token } from './token'
import { writeCompareForksInGroupWithUpstreamToCsv$ } from "../src/internals/gitlab/compare-forks";

const gitLabUrl = 'git.my-company.com'
const groupId = '7743'
const outdir = 'temp'

writeCompareForksInGroupWithUpstreamToCsv$(gitLabUrl, token, groupId, outdir)
    .subscribe()
