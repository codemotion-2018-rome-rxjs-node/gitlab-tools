"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nextPage = exports.runMergeRequestAnalysis = exports.toMergeRequestCompact = exports.readMergeRequestsForGroup = void 0;
const axios_1 = __importDefault(require("axios"));
const rxjs_1 = require("rxjs");
const merge_request_model_1 = require("./merge-request.model");
const analyze_merge_requests_1 = require("./analyze-merge-requests");
function readMergeRequestsForGroup(token, groupId) {
    const query = nextListMergeRequestsCommand(token, groupId, 1);
    const mergeRequests = [];
    let totPages;
    return (0, rxjs_1.from)(query).pipe((0, rxjs_1.map)(resp => {
        const mergeRequestsPaged = resp.data;
        mergeRequests.push(...mergeRequestsPaged);
        totPages = resp.headers['x-total-pages'];
        console.log(`>>>>> read page ${1} of ${totPages} (total pages) - Merge requests read: ${mergeRequests.length}`);
        const _nextPage = nextPage(parseInt(totPages));
        return { mergeRequests, _nextPage };
    }), (0, rxjs_1.expand)(({ mergeRequests, _nextPage }) => {
        const page = _nextPage();
        if (page === -1) {
            console.log(`>>>>> Reading of Merge Request completed`);
            return rxjs_1.EMPTY;
        }
        console.log(`>>>>> read page ${page} of ${totPages} (total pages) - Merge requests read: ${mergeRequests.length}`);
        return (0, rxjs_1.from)(nextListMergeRequestsCommand(token, groupId, page)).pipe((0, rxjs_1.map)(resp => {
            const mergeRequestsPaged = resp.data;
            mergeRequests.push(...mergeRequestsPaged);
            return { mergeRequests, _nextPage };
        }));
    }), (0, rxjs_1.last)(), (0, rxjs_1.map)(({ mergeRequests }) => mergeRequests));
}
exports.readMergeRequestsForGroup = readMergeRequestsForGroup;
function toMergeRequestCompact(mergeRequests) {
    const mergeRequestsCompact = mergeRequests.map(mergeRequest => {
        return (0, merge_request_model_1.newMergeRequestCompact)(mergeRequest);
    });
    return mergeRequestsCompact;
}
exports.toMergeRequestCompact = toMergeRequestCompact;
function runMergeRequestAnalysis(token, groupId) {
    return readMergeRequestsForGroup(token, groupId).pipe((0, rxjs_1.map)((mergeRequests) => toMergeRequestCompact(mergeRequests)), (0, rxjs_1.map)(mergeRequestsCompact => {
        return (0, analyze_merge_requests_1.runAnalysis)(mergeRequestsCompact);
    }));
}
exports.runMergeRequestAnalysis = runMergeRequestAnalysis;
function nextListMergeRequestsCommand(token, groupId, page) {
    const command = `https://git.ad.rgigroup.com/api/v4/groups/${groupId}/merge_requests?state=all&per_page=100&page=${page}`;
    return axios_1.default.get(command, {
        headers: {
            "PRIVATE-TOKEN": token
        }
    });
}
function nextPage(totPages) {
    let page = 1;
    return () => {
        if (page === totPages) {
            return -1;
        }
        page++;
        return page;
    };
}
exports.nextPage = nextPage;
//# sourceMappingURL=read-merge-requests.js.map