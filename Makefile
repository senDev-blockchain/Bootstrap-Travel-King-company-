BOOTSTRAP = ./docs/assets/css/bootstrap.css
BOOTSTRAP_LESS = ./less/bootstrap.less
BOOTSTRAP_RESPONSIVE = ./docs/assets/css/bootstrap-responsive.css
BOOTSTRAP_RESPONSIVE_LESS = ./less/responsive.less

#
# BUILD DOCS
#

docs:
	jshint js/*.js --config js/.jshintrc
	jshint js/tests/unit/*.js --config js/.jshintrc
	lessc ${BOOTSTRAP_LESS} > ${BOOTSTRAP}
	lessc ${BOOTSTRAP_RESPONSIVE_LESS} > ${BOOTSTRAP_RESPONSIVE}
	node docs/build
	cp img/* docs/assets/img/
	cp js/*.js docs/assets/js/
	cp js/tests/vendor/jquery.js docs/assets/js/

#
# BUILD SIMPLE BOOTSTRAP DIRECTORY
# lessc & uglifyjs are required
#

bootstrap:
	mkdir -p bootstrap/img
	mkdir -p bootstrap/css
	mkdir -p bootstrap/js
	cp img/* bootstrap/img/
	lessc ${BOOTSTRAP_LESS} > bootstrap/css/bootstrap.css
	lessc --yui-compress ${BOOTSTRAP_LESS} > bootstrap/css/bootstrap.min.css
	lessc ${BOOTSTRAP_RESPONSIVE_LESS} > bootstrap/css/bootstrap-responsive.css
	lessc --yui-compress ${BOOTSTRAP_RESPONSIVE_LESS} > bootstrap/css/bootstrap-responsive.min.css
	cat js/bootstrap-transition.js js/bootstrap-alert.js js/bootstrap-button.js js/bootstrap-carousel.js js/bootstrap-collapse.js js/bootstrap-dropdown.js js/bootstrap-modal.js js/bootstrap-tooltip.js js/bootstrap-popover.js js/bootstrap-scrollspy.js js/bootstrap-tab.js js/bootstrap-typeahead.js > bootstrap/js/bootstrap.js
	uglifyjs -nc bootstrap/js/bootstrap.js > bootstrap/js/bootstrap.min.tmp.js
	echo "/*!\n* Bootstrap.js by @fat & @mdo\n* Copyright 2012 Twitter, Inc.\n* http://www.apache.org/licenses/LICENSE-2.0.txt\n*/" > bootstrap/js/copyright.js
	cat bootstrap/js/copyright.js bootstrap/js/bootstrap.min.tmp.js > bootstrap/js/bootstrap.min.js
	rm bootstrap/js/copyright.js bootstrap/js/bootstrap.min.tmp.js

#
# MAKE FOR GH-PAGES 4 FAT & MDO ONLY (O_O  )
#

gh-pages: bootstrap docs
	rm -f docs/assets/bootstrap.zip
	zip -r docs/assets/bootstrap.zip bootstrap
	rm -r bootstrap
	rm -f ../bootstrap-gh-pages/assets/bootstrap.zip
	node docs/build production
	cp -r docs/* ../bootstrap-gh-pages

#
# WATCH LESS FILES
#

watch:
	echo "Watching less files..."; \
	watchr -e "watch('less/.*\.less') { system 'make' }"


.PHONY: docs watch gh-pages
