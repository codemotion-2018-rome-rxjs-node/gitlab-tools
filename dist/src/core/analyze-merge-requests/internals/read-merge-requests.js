"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMergeRequestAnalysis = exports.toMergeRequestCompact = exports.readMergeRequestsForGroup = void 0;
const rxjs_1 = require("rxjs");
const merge_request_model_1 = require("./merge-request.model");
const analyze_merge_requests_1 = require("./analyze-merge-requests");
const paged_command_1 = require("../../../internals/gitlab-functions/paged-command");
function readMergeRequestsForGroup(gitLabUrl, token, groupId) {
    const command = listMergeRequestsCommand(gitLabUrl, groupId);
    return (0, paged_command_1.runPagedCommand)(command, token);
}
exports.readMergeRequestsForGroup = readMergeRequestsForGroup;
function toMergeRequestCompact(mergeRequests) {
    const mergeRequestsCompact = mergeRequests.map(mergeRequest => {
        return (0, merge_request_model_1.newMergeRequestCompact)(mergeRequest);
    });
    return mergeRequestsCompact;
}
exports.toMergeRequestCompact = toMergeRequestCompact;
function runMergeRequestAnalysis(gitLabUrl, token, groupId) {
    return readMergeRequestsForGroup(gitLabUrl, token, groupId).pipe((0, rxjs_1.map)((mergeRequests) => toMergeRequestCompact(mergeRequests)), (0, rxjs_1.map)(mergeRequestsCompact => {
        return (0, analyze_merge_requests_1.runAnalysis)(mergeRequestsCompact);
    }));
}
exports.runMergeRequestAnalysis = runMergeRequestAnalysis;
function listMergeRequestsCommand(gitLabUrl, groupId) {
    return `https://${gitLabUrl}/api/v4/groups/${groupId}/merge_requests?state=all&per_page=100`;
}
//# sourceMappingURL=read-merge-requests.js.map