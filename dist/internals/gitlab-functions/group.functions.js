"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAllGroupProjects = exports.fetchGroupDescendantGroups = exports.readGroup = void 0;
const axios_1 = __importDefault(require("axios"));
const rxjs_1 = require("rxjs");
function readGroup(gitLabUrl, token, groupId) {
    const command = `https://${gitLabUrl}/api/v4/groups/${groupId}`;
    return (0, rxjs_1.from)(axios_1.default.get(command, {
        headers: {
            "PRIVATE-TOKEN": token
        }
    })).pipe((0, rxjs_1.map)(resp => {
        return resp.data;
    }));
}
exports.readGroup = readGroup;
function fetchGroupDescendantGroups(gitLabUrl, token, groupId) {
    const command = `https://${gitLabUrl}/api/v4/groups/${groupId}/descendant_groups`;
    return (0, rxjs_1.from)(axios_1.default.get(command, {
        headers: {
            "PRIVATE-TOKEN": token
        }
    })).pipe((0, rxjs_1.map)(resp => {
        return resp.data;
    }));
}
exports.fetchGroupDescendantGroups = fetchGroupDescendantGroups;
function fetchAllGroupProjects(gitLabUrl, token, groupId, includeArchived = false) {
    const command = `https://${gitLabUrl}/api/v4/groups/${groupId}/projects?include_subgroups=true&per_page=100`;
    return (0, rxjs_1.from)(axios_1.default.get(command, {
        headers: {
            "PRIVATE-TOKEN": token
        }
    })).pipe((0, rxjs_1.map)(resp => {
        const projects = includeArchived ? resp.data : resp.data.filter((project) => !project.archived);
        return projects;
    }));
}
exports.fetchAllGroupProjects = fetchAllGroupProjects;
//# sourceMappingURL=group.functions.js.map