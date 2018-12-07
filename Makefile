export PATH := node_modules/.bin:$(PATH)
.DEFAULT_GOAL := release

version = $$(git describe | cut -d- -f 1)

# bump ?= patch
bump := $(if $(strip $(bump)),$(bump),patch)

changelog_msg := "doc: Update CHANGELOG.md"

.PHONY: clean
clean:
	lerna clean -y && lerna exec 'rm -rf dist'

.PHONY: build
build:
	lerna bootstrap --hoist
	lerna run --bail --stream build

.PHONY: test
test: build
	lerna run --bail --stream test

.PHONY: release
release: clean
	if [ -z "$(bump)" ]; then echo "\nPlease specify bump!\n"; exit 1; fi;
	changelog --$(bump) -t $(version)
	git add CHANGELOG.md
	git commit -m $(changelog_msg)
	lerna bootstrap --hoist
	lerna run --bail --stream release
	#lerna publish $(bump)