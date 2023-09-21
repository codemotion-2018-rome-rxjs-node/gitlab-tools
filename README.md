# gitlab-tools

gitlab-tools is a set of tools designed to work with gitlab repos.

# Analyze Merge Requests

It is possible to analyze the merge requests of a gitlab group with the command

`node ./dist/lib/command.js analyze-merge-requests --gitLabUrl <gitLab url> --token <PRIVATE_TOKEN> --groupId <id> --outdir <outdir>`

or via npx

` npx "@enrico.piccinin/gitlab-tools" analyze-merge-requests --gitLabUrl <gitLab url> --token <PRIVATE_TOKEN> --groupId <id> --outdir <outdir>`

# Read Gitlab Group Projects

It is possible to read the all the projects in a Gitlab group with the command and create list of such projects:

`node ./dist/lib/command.js read-group-projects --gitLabUrl <gitLab url> --token <PRIVATE_TOKEN> --groupId <id> --outdir <outdir>`

or via npx

` npx "@enrico.piccinin/gitlab-tools" read-group-projects --gitLabUrl <gitLab url> --token <PRIVATE_TOKEN> --groupId <id> --outdir <outdir>`

After reading the commits, the following files are created:

-   <group-name>-projects.csv

# Clone Gitlab Projects

It is possible to clone all the projects contained in a Gitlab group with the command

`node ./dist/lib/command.js clone-group-projects --gitLabUrl <gitLab url> --token <PRIVATE_TOKEN> --groupId <id> --outdir <outdir>`

or via npx

` npx "@enrico.piccinin/gitlab-tools" clone-group-projects --gitLabUrl <gitLab url> --token <PRIVATE_TOKEN> --groupId <id> --outdir <outdir>`

# Read Commits from Repos

It is possible to read the commit records of all repos contained in a folder (after having cloned them, for instance with the `clone-group-projects` command).

To read the commits run the command

`node ./dist/lib/command.js read-repos-commits --folderPath <path to folder> --outdir <outdir>`

or via npx

` npx "@enrico.piccinin/gitlab-tools" read-repos-commits --folderPath <path to folder> --outdir <outdir>`

After reading the commits, the following files are created:

-   <folder-name>.json
-   <folder-name>-repos-commits-by-month.json
-   <folder-name>-repos-commits-by-month.csv

# Calculate cloc (number of lines of code)

It is possible to calculate the lines of code of all files in all repos contained in a folder (after having cloned them, e.g. with the `clone-group-projects` command).

To calculate cloc run the command

`node ./dist/lib/command.js cloc-repos --folderPath <path to folder> --outdir <outdir>`

or via npx

` npx "@enrico.piccinin/gitlab-tools" cloc-repos --folderPath <path to folder> --outdir <outdir>`

This command produces the following files:

-   <folder-name>-cloc.json
-   <folder-name>-cloc.csv

# Calculate the "code-tunover" of repos

It is possible to calculate the "code-tunover" of repos contained in a folder.

"code-handlig" between two subsequent commits is the number of lines changed, added and removed between the 2 commits.

The "code-hanlding" calculated on a repo is the sum of all lines added, removed or changed between all pairs of subsequent commits between the start date and the end date.

To calculate the "code-tunover" run the command

`node ./dist/lib/command.js cloc-diff-repos --folderPath <path to folder> --outdir <outdir> --languages <languages...> --form <fromDate> --to <toDate> --concurrency <numOfConcurrentCalculations> --excludeRepoPaths <pathsToExclude...>`

`node ./dist/lib/command.js cloc-diff-repos --folderPath ./ --outdir ./out --languages "TypeScript" "Markdown" --from 2023-01-01 --concurrency 10 --excludeRepoPaths "*dbm" "dbobjects*"`

or via npx

` npx "@enrico.piccinin/gitlab-tools" cloc-diff-repos --folderPath <path to folder> --outdir <outdir> --languages <languages...> --form <fromDate> --to <toDate> --concurrency <numOfConcurrentCalculations> --excludeRepoPaths <pathsToExclude...>`

This command produces the following files:

-   <folder-name>-cloc-diff.json
-   <folder-name>-cloc-diff.csv

# Calculate the monthly diffences in the code base of repos

It is possible to calculate the difference in the code base of a list of repos. The difference is calculated at a monthly bases.

This means that for each month we consider the last commit of the first commit of the month and first commit of the previous month and then we calculate the differences between these 2 months.

This algorithm is pretty efficient in terms of time since it runs only one difference calculation per month. At the same time it gives an approximation of the "code-tunover" that actually occurred in one month. A more precise calculation of "code-tunover" can be obtained with the `cloc-diff-repos` option.

The repos considered are all the git repos contained in a folder.

To calculate cloc diff run the command

`node ./dist/lib/command.js cloc-monthly-diff-repos --folderPath <path to folder> --outdir <outdir> --languages <languages...> --form fromDate --to toDate`

`node ./dist/lib/command.js cloc-monthly-diff-repos --folderPath ./ --outdir ./out --languages "TypeScript" "Markdown" --from 2023-01-01`

or via npx

` npx "@enrico.piccinin/gitlab-tools" cloc-diff-repos --folderPath <path to folder> --outdir <outdir> --languages <languages...>`

This command produces the following files:

-   <folder-name>-monthly-cloc-diff.json
-   <folder-name>-monthly-cloc-diff.csv

## MISCELLANEOUS

gitlab-tools is a node app configured to use Typescript scaffolded using the package `@enrico.piccinin/create-node-ts-app`.

gitlab-tools can be published as a package on the public NPM registry.

Once published, gitlab-tools can be invoked to execute a command using `npx`

Contains a configuration for `eslint` and `prettier`.

Testing is based on the `mocha` and `chai` libraries.

The `src` folder has the following structure:

-   `lib` folder containing the command
-   `core` folder containing `exec-command.ts` which implements the logic to execute the command
-   `core/internals` folder containing the internals of the logic of the command

## test

Run the tests using the command

`npm run test`

## Publish on NPM registry

### Commit changes

Before publishin a version of the command, make sure all the changes are committed.

The publishing procedure will ensure that a new "patch" version will be created and a new tag added.

### Define a remote repo

The publishing procedure "pushes" all changes to a remote destination. Therefore, before publishing, we need to ensure that a remote repo is defined, running the following commands

`git remote add origin http://github.com/<org-name>/<repo-name>`

` git push --set-upstream origin main`

### Publishing

Once all changes have been committed and the remote destination has been setup, then we can publish the command.

To publish on NPM registry the package rune the command

`npm publish`

## Execute the command

Once published on NPM registry the command defined by the package can be executed running the command

`npx gitlab-tools`

### Default command

The command executed by default is the one specified in the `bin` property of `package.json`.

The default `bin` value is the following

```json
"bin": {
 "app-name": "dist/lib/command.js"
},
```

which means that `npx gitlab-tools` executes the command `dist/lib/command.js`.

It is possible to to define other additional commands like this

```json
"bin": {
 "app-name": "dist/lib/command.js",
 "another-command": "dist/lib/another-command.js",
},
```

To execute another command we need to use the `-p` option of `npx`, like this
`npx -p gitlab-tools another-command`
