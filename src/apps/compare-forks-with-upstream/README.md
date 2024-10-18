# Compare all the forked projects in a GitLab group (walked recursively) with the upstream projects

This command compares the forked projects present in a GitLab group and all its subgroups with the upstream project, i.e. the project from which the forked project was forked.
In particular:
- for the forked project we consider the most recent branch or tag
- for the upstream project we consider the default branch
The comparison is performed between these 2 branches.\
The result of the comparison contains the number of commits which for which the forked project (at its latest branch or tag) is ahead and behind.\
This is the same information that can be read on the GitLab web interface with the url:\
`https://my.gitlab.server/path/to/the/forked/project/-/tree/last-tag-or-branch`.\

The command can be launched as a node script with the following exectutin the following command:

`node ./dist/lib/command.js compare-forks-with-upstream --gitLabUrl <gitLab url> --token <PRIVATE_TOKEN> --groupId <id> --outdir <outdir>`

or via npx

` npx "@enrico.piccinin/gitlab-tools" compare-forks-with-upstream --gitLabUrl <gitLab url> --token <PRIVATE_TOKEN> --groupId <id> --outdir <outdir>`

The results of the comparison are written in the following file:

-   <group-name>-compare-result-file-details-YYYY-MM-DDThh-mm-ss.csv