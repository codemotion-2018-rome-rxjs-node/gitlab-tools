"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const read_merge_requests_1 = require("./read-merge-requests");
describe(`nextMergeRequestsCommand`, () => {
    it(`should return the command to be used to read the next page - when totPages number is reached return -1`, () => {
        const totPages = 3;
        const _nextPage = (0, read_merge_requests_1.nextPage)(totPages);
        (0, chai_1.expect)(_nextPage()).equal(2);
        (0, chai_1.expect)(_nextPage()).equal(3);
        (0, chai_1.expect)(_nextPage()).equal(-1);
    });
});
//# sourceMappingURL=read-merge-requests.spec.js.map