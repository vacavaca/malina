export PATH := node_modules/.bin:$(PATH)
.DEFAULT_GOAL := publish

bump := $(if $(strip $(bump)),$(bump),patch)

release_msg := "Update CHANGELOG.md and parent package version"

.PHONY: clean
clean:
	lerna clean -y && lerna exec 'rm -rf dist'

.PHONY: build
build: clean
	lerna bootstrap --hoist
	lerna run --bail --stream build

.PHONY: test
test: build
	lerna run --bail --stream test

.PHONY: build
build: release
release:
	lerna bootstrap --hoist
	lerna run --bail --stream release

.PHONY: publish
publish:
	if [ -z "$(bump)" ]; then echo "\nPlease specify bump!\n"; exit 1; fi;
	changelog --$(bump)
	npm version $(bump) --no-git-tag-version
	git add CHANGELOG.md package.json package-lock.json
	git commit -m $(release_msg)
	lerna publish $(bump)
