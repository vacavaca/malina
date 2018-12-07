export PATH := node_modules/.bin:$(PATH)
.DEFAULT_GOAL := publish

bump := $(if $(strip $(bump)),$(bump),patch)

changelog_msg := "doc: Update CHANGELOG.md"

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
publish: clean
	if [ -z "$(bump)" ]; then echo "\nPlease specify bump!\n"; exit 1; fi;
	npm version $(bump) --no-git-tag-version
	changelog --$(bump)
	git add CHANGELOG.md
	git commit -m $(changelog_msg)
	lerna publish $(bump)
