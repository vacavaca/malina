export PATH := node_modules/.bin:$(PATH)
.DEFAULT_GOAL := publish
RUNNER_ENV ?= development
bump := $(if $(strip $(bump)),$(bump),patch)
release_msg := "Update CHANGELOG.md and parent package version"
lock_msg := "Update package-lock.json files"

.PHONY: clean
clean:
	lerna clean -y

.PHONY: clean-dist
clean-dist:
	lerna run --stream clean

.PHONY: bootstrap
bootstrap: clean
ifeq ($(RUNNER_ENV),ci)
	lerna bootstrap --ci
else
	lerna bootstrap --hoist
endif

.PHONY: build
build:
	lerna run --bail --stream --no-private build

.PHONY: check
check: build
	lerna exec --no-private 'make check'

.PHONY: test
test: build
	lerna exec --no-private 'make test'

.PHONY: benchmark
benchmark: build
	lerna exec --no-private 'make benchmark'

.PHONY: release
release: bootstrap clean-dist
	lerna run --bail --stream release

.PHONY: publish
publish:
	if [ -z "$(bump)" ]; then echo "\nPlease specify bump!\n"; exit 1; fi;
	changelog --$(bump)
	npm version $(bump) --no-git-tag-version
	git add CHANGELOG.md package.json package-lock.json
	git commit -m $(release_msg)
	lerna publish $(bump)
	npm install
	lerna exec 'npm install'
	git add packages/*/package-lock.json package-lock.json
	git commit -m $(lock_msg)
	git push origin master
