export PATH := node_modules/.bin:$(PATH)
NODE_ENV ?= development
SHELL := /bin/bash


.PHONY: compile-docs
compile-docs:
	find src/templates -name "*.md" | rev | cut -d '.' -f 2- | rev | xargs -i -t marked -o {}.html {}.md

.PHONY: clean
clean:
	find src/templates -name "*.html" | xargs rm