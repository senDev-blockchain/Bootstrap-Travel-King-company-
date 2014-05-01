$(function () {

  module('scrollspy plugin')

  test('should be defined on jquery object', function () {
    ok($(document.body).scrollspy, 'scrollspy method is defined')
  })

  module('scrollspy', {
    setup: function() {
      // Run all tests in noConflict mode -- it's the only way to ensure that the plugin works in noConflict mode
      $.fn.bootstrapScrollspy = $.fn.scrollspy.noConflict()
    },
    teardown: function() {
      $.fn.scrollspy = $.fn.bootstrapScrollspy
      delete $.fn.bootstrapScrollspy
    }
  })

  test('should provide no conflict', function () {
    ok(!$.fn.scrollspy, 'scrollspy was set back to undefined (org value)')
  })

  test('should return element', function () {
    ok($(document.body).bootstrapScrollspy()[0] == document.body, 'document.body returned')
  })

  test('should switch active class on scroll', function () {
    var sectionHTML = '<div id="masthead"></div>',
        topbarHTML = '<div class="topbar">' +
        '<div class="topbar-inner">' +
        '<div class="container">' +
        '<h3><a href="#">Bootstrap</a></h3>' +
        '<li><a href="#masthead">Overview</a></li>' +
        '</ul>' +
        '</div>' +
        '</div>' +
        '</div>',
        $topbar = $(topbarHTML).bootstrapScrollspy()

    $(sectionHTML).append('#qunit-fixture')
    ok($topbar.find('.active', true))
  })

  test('should only switch active class on current target', function () {
    var sectionHTML = '<div id="root" class="active">' +
        '<div class="topbar">' +
        '<div class="topbar-inner">' +
        '<div class="container" id="ss-target">' +
        '<ul class="nav">' +
        '<li><a href="#masthead">Overview</a></li>' +
        '<li><a href="#detail">Detail</a></li>' +
        '</ul>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div id="scrollspy-example" style="height: 100px; overflow: auto;">' +
        '<div style="height: 200px;">' +
        '<h4 id="masthead">Overview</h4>' +
        '<p style="height: 200px">' +
        'Ad leggings keytar, brunch id art party dolor labore.' +
        '</p>' +
        '</div>' +
        '<div style="height: 200px;">' +
        '<h4 id="detail">Detail</h4>' +
        '<p style="height: 200px">' +
        'Veniam marfa mustache skateboard, adipisicing fugiat velit pitchfork beard.' +
        '</p>' +
        '</div>' +
        '</div>' +
        '</div>',
        $section = $(sectionHTML).appendTo('#qunit-fixture'),
        $scrollSpy = $section
        .show()
        .find('#scrollspy-example')
        .bootstrapScrollspy({target: '#ss-target'})

    $scrollSpy.scrollTop(350);
    ok($section.hasClass('active'), 'Active class still on root node')
  })
})
