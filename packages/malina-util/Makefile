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
	./node_modules/uglify-es/bin/uglifyjs -m toplevel $(build_node) > $(node_release)
else
	cp $(build_node) $(node_release)
endif

.PHONY: test
test:
	NODE_ENV=testing nyc --reporter=html mocha --require @babel/register test

.PHONY: coverage
coverage:
	NODE_ENV=testing nyc $(COVFLAGS) mocha -R min --require @babel/register test

.PHONY: benchmark
benchmark:
	echo "Nothing to benchmark yet"

.PHONY: check
check: lint test

.PHONY: build
build:  						 \
	clean			 				 \
	$(node_release)

.PHONY: release
release:						 \
	clean 	  				 \
	check 						 \
	$(node_release)		 \
	post-clean

.PHONY: doc
doc:
	jsdoc -c jsdoc.conf.json -r --verbose
