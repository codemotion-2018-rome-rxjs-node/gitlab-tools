# Analyze Merge Requests

It is possible to analyze the merge requests of a gitlab group with the command

`node ./dist/lib/command.js analyze-merge-requests --gitLabUrl <gitLab url> --token <PRIVATE_TOKEN> --groupId <id> --outdir <outdir>`

or via npx

` npx "@enrico.piccinin/gitlab-tools" analyze-merge-requests --gitLabUrl <gitLab url> --token <PRIVATE_TOKEN> --groupId <id> --outdir <outdir>`