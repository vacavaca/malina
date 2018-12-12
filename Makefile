export PATH := node_modules/.bin:$(PATH)
.DEFAULT_GOAL := publish
RUNNER_ENV ?= development
bump := $(if $(strip $(bump)),$(bump),patch)
release_msg := "Update CHANGELOG.md and parent package version"

.PHONY: clean
clean:
	lerna clean -y

.PHONY: clean-dist
clean-dist:
	lerna exec 'rm -rf dist'

.PHONY: prepare
prepare: clean
ifeq ($(RUNNER_ENV),ci)
	lerna bootstrap
else
	lerna bootstrap --hoist
endif

.PHONY: build
build: prepare clean-dist
	lerna run --bail --no-private build

.PHONY: check
check: prepare
	lerna run --bail --stream check

.PHONY: test
test:
	lerna run --bail --stream --no-private test

.PHONY: release
release: prepare clean-dist
	lerna run --bail --stream release

.PHONY: publish
publish:
	if [ -z "$(bump)" ]; then echo "\nPlease specify bump!\n"; exit 1; fi;
	changelog --$(bump)
	npm version $(bump) --no-git-tag-version
	git add CHANGELOG.md package.json package-lock.json
	git commit -m $(release_msg)
	lerna publish $(bump)
