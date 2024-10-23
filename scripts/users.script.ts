
import {  writeUsersToCsv$ } from '../src/internals/gitlab/users'
import { token } from './token'

const gitLabUrl = 'git.my-company.com'

const outDir = './out'

writeUsersToCsv$(gitLabUrl, token, outDir)
.subscribe((users) => {
    console.log(`====>>>> users`, users)
})