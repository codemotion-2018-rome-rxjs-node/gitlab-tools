import { expect } from 'chai';
import { clocOnRepos } from './repo-cloc.functions';

describe('clocOnRepos', () => {
    it(`should return an array of language statistics for each repository of the current folder
    since the current folder has just 1 repo, there will be just 1 item in the array`, (done) => {
        const path = './'
        clocOnRepos(path).subscribe((stats) => {
            expect(stats instanceof Array).to.be.true;
            expect(stats.length).equal(1);
            const statsForThisRepo = stats[0].clocStats
            expect(statsForThisRepo instanceof Array).to.be.true;
            expect(statsForThisRepo.length).greaterThan(0);
            expect(!!statsForThisRepo[0].language).to.be.true;
            expect(!!statsForThisRepo[0].files).to.be.true;
            expect(!!statsForThisRepo[0].blank).to.be.true;
            expect(!!statsForThisRepo[0].comment).to.be.true;
            expect(!!statsForThisRepo[0].code).to.be.true;

            expect(stats[0].repoPath).equal(path);
            done();
        });
    });
});