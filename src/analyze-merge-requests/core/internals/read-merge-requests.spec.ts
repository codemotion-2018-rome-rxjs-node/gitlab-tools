import { expect } from 'chai';
import { nextPage } from './read-merge-requests';

describe(`nextMergeRequestsCommand`, () => {
    it(`should return the command to be used to read the next page - when totPages number is reached return -1`, () => {
        const totPages = 3
        const _nextPage = nextPage(totPages)

        expect(_nextPage()).equal(2)
        expect(_nextPage()).equal(3)
        expect(_nextPage()).equal(-1)
    });

});