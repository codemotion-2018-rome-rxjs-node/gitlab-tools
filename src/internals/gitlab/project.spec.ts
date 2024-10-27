import { expect } from 'chai';
import { convertHttpsToSshUrl } from './project';

describe(`convertHttpsToSshUrl`, () => {
    it(`should return the ssh url from an https url`, () => {
        const httpsUrl = 'https://abc.corp.com/group/subgroup/project.git'
        const expectedSshUrl = 'git@abc.corp.com:group/subgroup/project.git'

        const sshUrl = convertHttpsToSshUrl(httpsUrl)

        expect(sshUrl).equal(expectedSshUrl)
    });

});