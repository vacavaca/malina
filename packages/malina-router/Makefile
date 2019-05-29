export PATH := node_modules/.bin:$(PATH)
NODE_ENV ?= development

.DEFAULT_GOAL := release

build_node := dist/index.node.js
node_release := dist/index.js

.PHONY: lint
lint:
	eslint *.js src

.PHONY: clean
clean:
	rm -rf dist/*

.PHONY: post-clean
post-clean:
	rm $(build_node)

$(build_node): src
	rollup -c rollup.config.js

$(node_release): $(build_node)
ifeq ($(NODE_ENV),production)
	uglifyjs -m toplevel $(build_node) > $(node_release)
else
	cp $(build_node) $(node_release)
endif

.PHONY: check
check: lint

.PHONY: test
test:
	echo "Nothing to test yet"

.PHONY: benchmark
benchmark:
	echo "Nothing to benchmark yet"

.PHONY: build
build:  						 \
	clean			 				 \
	$(node_release)

.PHONY: release
release:						 \
	clean 	  				 \
	check 						 \
	$(node_release)	   \
	post-clean

