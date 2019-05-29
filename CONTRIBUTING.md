# Contributing to Malina

## Code Structure

* [examples](https://github.com/vacavaca/malina/tree/master/examples): Example applications
* packages/*/src: Source code
* packages/*/test: Tests


## Tools

* [npm](https://docs.npmjs.com/about-npm/) managing packages and dependencies 
* [make](https://www.gnu.org/software/make/) task runner, development tools

Installed via npm:

* [lerna](https://lernajs.io/) managing multiple packages in one repo
* [eslint](https://eslint.org/) linting
* [rollup](https://rollupjs.org/) bundler
* [commitizen](https://npmjs.com/package/commitizen) and [generate-changelog](https://npmjs.com/package/generate-changelog) are configured to simplify publishing

## Commands

### Boostrap project, link dependencies

`npm run bootstrap`

### Run tests

`npm run test`

### Run benchmarks

`npm run benchmark`

### Run linter and tests

`npm run check`

### Clean build directories

`npm run clean`

### Clean dist directories

`npm run clean-dist`

### Build packages for development

`npm run build`

### Build packages for distribution

`npm run release`

### Publish packages

`npm run publish BUMP`

eg. `npm run publish patch`

### Commit changes

`npm run commit`


Inside the packages directory the following npm commands are usualy available:

* `test` run unit tests
* `build` build package for development
* `release` build package for distribution

To lint the code inside a package make a `lint`:

`make lint`

Example projects and the project site may differ in configuration, please refer to the corresponding package.json

## Publishing

1. Commit or stash all changes in the working tree
2. Check packages `npm run check`
3. Build packages for production `npm run release`
4. Commit builded packages using this message: "*chore: Update package distributions*"
5. Run `npm run publish [BUMP]` to publish packages 