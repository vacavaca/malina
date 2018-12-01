export PATH := node_modules/.bin:$(PATH)
NODE_ENV ?= development

.DEFAULT_GOAL := release

build_node := dist/index.node.js
build_browser := dist/index.browser.js
node_release := dist/index.js
browser_release := dist/browser.js

.PHONY: lint
lint:
	eslint *.js src

.PHONY: clean
clean:
	rm -rf dist/*

$(build_node): src
	rollup -c rollup.node.js

$(build_browser): src
	rollup -c rollup.browser.js

$(node_release): $(build_node)
ifeq ($(NODE_ENV),production)
	uglifyjs -m toplevel $(build_node) > $(node_release)
else
	cp $(build_node) $(node_release)
endif
	rm -f $(build_node)

$(browser_release): $(build_browser)
ifeq ($(NODE_ENV),production)
	uglifyjs -m toplevel $(build_browser) > $(browser_release)
else
	cp $(build_browser) $(browser_release)
endif
	rm -f $(build_browser)

.PHONY: test
test: clean $(node_release)
	mocha test test

.PHONY: check
check: lint test

.PHONY: build
build:  						 \
	clean			 				 \
	$(node_release) 	 \
	$(browser_release) \

.PHONY: release
release:						 \
	clean 	  				 \
	check 						 \
	$(node_release) 	 \
	$(browser_release) \

