# Contributing to Malina

## Code Structure

* [examples](https://github.com/vacavaca/malina/tree/master/examples): Example applications
* packages/*/src: Source code
* packages/*/test: Tests


## Tools

* [npm](https://docs.npmjs.com/about-npm/) managing packages and dependencies 
* [make](https://www.gnu.org/software/make/) task runner, development tools
* [lerna](https://lernajs.io/) managing multiple packages in one repo
* [eslint](https://eslint.org/) linting
* [rollup](https://rollupjs.org/) bundler

* [commitizen](npmjs.com/package/commitizen) and [generate-changelog](http://npmjs.com/package/generate-changelog) are configured to simplify publishing

## Commands

### Run tests

`npm run test`

### Clean build directories

`npm run clean`

### Build packages for development

`npm run build`

### Build packages for distribution

`npm run release`

### Publish packages

`npm run publish BUMP`

eg. `npm run publish patch`


Inside package directories the following npm commands are usualy available:

* `test` run unit tests
* `build` build package for development
* `release` build package for distribution

To lint the code inside a package make a `lint`:

`make lint`


