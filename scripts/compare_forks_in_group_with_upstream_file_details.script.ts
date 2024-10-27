import { token } from './token'
import { writeCompareForksWithUpstreamFileDetailsInGroupToCsv$ } from "../src/internals/gitlab/compare-forks";

const gitLabUrl = 'git.my-company.com'
const groupId = '7743'
const outdir = 'temp'

writeCompareForksWithUpstreamFileDetailsInGroupToCsv$(gitLabUrl, token, groupId, outdir)
    .subscribe()
