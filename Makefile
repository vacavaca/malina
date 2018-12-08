export PATH := node_modules/.bin:$(PATH)
.DEFAULT_GOAL := publish
RUNNER_ENV ?= development
bump := $(if $(strip $(bump)),$(bump),patch)
release_msg := "Update CHANGELOG.md and parent package version"

.PHONY: clean
clean:
	lerna clean -y && lerna exec 'rm -rf dist'

.PHONY: build
prepare: clean
ifeq ($(RUNNER_ENV),ci)
	lerna bootstrap
else
	lerna bootstrap --hoist
endif

.PHONY: build
build: prepare
	lerna run --bail build

.PHONY: test
test: build
	lerna run --bail --stream test

.PHONY: build
release: prepare
	lerna run --bail --stream release

.PHONY: publish
publish:
	if [ -z "$(bump)" ]; then echo "\nPlease specify bump!\n"; exit 1; fi;
	changelog --$(bump)
	npm version $(bump) --no-git-tag-version
	git add CHANGELOG.md package.json package-lock.json
	git commit -m $(release_msg)
	lerna publish $(bump)
