"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reposInFolder = void 0;
var fs = require("fs");
var path_1 = require("path");
// reposInFolder returns the list of git repos paths in a given folder
function reposInFolder(folderPath) {
    var gitRepos = [];
    var filesAndDirs = fs.readdirSync(folderPath);
    if (filesAndDirs.some(function (fileOrDir) { return fileOrDir === '.git'; })) {
        gitRepos.push(folderPath);
    }
    filesAndDirs.forEach(function (fileOrDir) {
        var absolutePath = path_1.default.join(folderPath, fileOrDir);
        if (fs.statSync(absolutePath).isDirectory()) {
            var subRepos = reposInFolder(absolutePath);
            gitRepos = gitRepos.concat(subRepos);
        }
    });
    return gitRepos;
}
exports.reposInFolder = reposInFolder;
