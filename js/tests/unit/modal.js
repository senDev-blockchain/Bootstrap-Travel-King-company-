$(function () {
  'use strict';

  QUnit.module('modal plugin')

  QUnit.test('should be defined on jquery object', function (assert) {
    assert.ok($(document.body).modal, 'modal method is defined')
  })

  QUnit.module('modal', {
    setup: function () {
      // Run all tests in noConflict mode -- it's the only way to ensure that the plugin works in noConflict mode
      $.fn.bootstrapModal = $.fn.modal.noConflict()
    },
    teardown: function () {
      $.fn.modal = $.fn.bootstrapModal
      delete $.fn.bootstrapModal
    }
  })

  QUnit.test('should provide no conflict', function (assert) {
    assert.strictEqual($.fn.modal, undefined, 'modal was set back to undefined (orig value)')
  })

  QUnit.test('should return jquery collection containing the element', function (assert) {
    var $el = $('<div id="modal-test"/>')
    var $modal = $el.bootstrapModal()
    assert.ok($modal instanceof $, 'returns jquery collection')
    assert.strictEqual($modal[0], $el[0], 'collection contains element')
  })

  QUnit.test('should expose defaults var for settings', function (assert) {
    assert.ok($.fn.bootstrapModal.Constructor.DEFAULTS, 'default object exposed')
  })

  QUnit.test('should insert into dom when show method is called', function (assert) {
    var done = assert.async()

    $('<div id="modal-test"/>')
      .on('shown.bs.modal', function () {
        assert.notEqual($('#modal-test').length, 0, 'modal inserted into dom')
        done()
      })
      .bootstrapModal('show')
  })

  QUnit.test('should set aria-hidden to false when show method is called', function (assert) {
    var done = assert.async()

    $('<div id="modal-test"/>')
      .on('shown.bs.modal', function () {
        assert.strictEqual($('#modal-test').attr('aria-hidden'), 'false', 'aria-hidden is set to string "false" when modal shown')
        done()
      })
      .bootstrapModal('show')
  })

  QUnit.test('should fire show event', function (assert) {
    var done = assert.async()

    $('<div id="modal-test"/>')
      .on('show.bs.modal', function () {
        assert.ok(true, 'show event fired')
        done()
      })
      .bootstrapModal('show')
  })

  QUnit.test('should not fire shown when show was prevented', function (assert) {
    var done = assert.async()

    $('<div id="modal-test"/>')
      .on('show.bs.modal', function (e) {
        e.preventDefault()
        assert.ok(true, 'show event fired')
        done()
      })
      .on('shown.bs.modal', function () {
        assert.ok(false, 'shown event fired')
      })
      .bootstrapModal('show')
  })

  QUnit.test('should hide modal when hide is called', function (assert) {
    var done = assert.async()

    $('<div id="modal-test"/>')
      .on('shown.bs.modal', function () {
        assert.ok($('#modal-test').is(':visible'), 'modal visible')
        assert.notEqual($('#modal-test').length, 0, 'modal inserted into dom')
        $(this).bootstrapModal('hide')
      })
      .on('hidden.bs.modal', function () {
        assert.ok(!$('#modal-test').is(':visible'), 'modal hidden')
        done()
      })
      .bootstrapModal('show')
  })

  QUnit.test('should set aria-hidden to true when hide is called', function (assert) {
    var done = assert.async()

    $('<div id="modal-test"/>')
      .on('shown.bs.modal', function () {
        assert.strictEqual($('#modal-test').length, 1, 'modal has been inserted into the dom')
        $(this).bootstrapModal('hide')
      })
      .on('hidden.bs.modal', function () {
        assert.strictEqual($('#modal-test').attr('aria-hidden'), 'true', 'aria-hidden is set to string "true" when modal shown')
        done()
      })
      .bootstrapModal('show')
  })

  QUnit.test('should toggle when toggle is called', function (assert) {
    var done = assert.async()

    $('<div id="modal-test"/>')
      .on('shown.bs.modal', function () {
        assert.ok($('#modal-test').is(':visible'), 'modal visible')
        assert.notEqual($('#modal-test').length, 0, 'modal inserted into dom')
        $(this).bootstrapModal('toggle')
      })
      .on('hidden.bs.modal', function () {
        assert.ok(!$('#modal-test').is(':visible'), 'modal hidden')
        done()
      })
      .bootstrapModal('toggle')
  })

  QUnit.test('should remove from dom when click [data-dismiss="modal"]', function (assert) {
    var done = assert.async()

    $('<div id="modal-test"><span class="close" data-dismiss="modal"/></div>')
      .on('shown.bs.modal', function () {
        assert.ok($('#modal-test').is(':visible'), 'modal visible')
        assert.notEqual($('#modal-test').length, 0, 'modal inserted into dom')
        $(this).find('.close').click()
      })
      .on('hidden.bs.modal', function () {
        assert.ok(!$('#modal-test').is(':visible'), 'modal hidden')
        done()
      })
      .bootstrapModal('toggle')
  })

  QUnit.test('should allow modal close with "backdrop:false"', function (assert) {
    var done = assert.async()

    $('<div id="modal-test" data-backdrop="false"/>')
      .on('shown.bs.modal', function () {
        assert.ok($('#modal-test').is(':visible'), 'modal visible')
        $(this).bootstrapModal('hide')
      })
      .on('hidden.bs.modal', function () {
        assert.ok(!$('#modal-test').is(':visible'), 'modal hidden')
        done()
      })
      .bootstrapModal('show')
  })

  QUnit.test('should close modal when clicking outside of modal-content', function (assert) {
    var done = assert.async()

    $('<div id="modal-test"><div class="contents"/></div>')
      .on('shown.bs.modal', function () {
        assert.notEqual($('#modal-test').length, 0, 'modal inserted into dom')
        $('.contents').click()
        assert.ok($('#modal-test').is(':visible'), 'modal visible')
        $('#modal-test .modal-backdrop').click()
      })
      .on('hidden.bs.modal', function () {
        assert.ok(!$('#modal-test').is(':visible'), 'modal hidden')
        done()
      })
      .bootstrapModal('show')
  })

  QUnit.test('should close modal when escape key is pressed via keydown', function (assert) {
    var done = assert.async()

    var div = $('<div id="modal-test"/>')
    div
      .on('shown.bs.modal', function () {
        assert.ok($('#modal-test').length, 'modal insterted into dom')
        assert.ok($('#modal-test').is(':visible'), 'modal visible')
        div.trigger($.Event('keydown', { which: 27 }))

        setTimeout(function () {
          assert.ok(!$('#modal-test').is(':visible'), 'modal hidden')
          div.remove()
          done()
        }, 0)
      })
      .bootstrapModal('show')
  })

  QUnit.test('should not close modal when escape key is pressed via keyup', function (assert) {
    var done = assert.async()

    var div = $('<div id="modal-test"/>')
    div
      .on('shown.bs.modal', function () {
        assert.ok($('#modal-test').length, 'modal inserted into dom')
        assert.ok($('#modal-test').is(':visible'), 'modal visible')
        div.trigger($.Event('keyup', { which: 27 }))

        setTimeout(function () {
          assert.ok($('#modal-test').is(':visible'), 'modal still visible')
          div.remove()
          done()
        }, 0)
      })
      .bootstrapModal('show')
  })

  QUnit.test('should trigger hide event once when clicking outside of modal-content', function (assert) {
    var done = assert.async()

    var triggered

    $('<div id="modal-test"><div class="contents"/></div>')
      .on('shown.bs.modal', function () {
        triggered = 0
        $('#modal-test .modal-backdrop').click()
      })
      .on('hide.bs.modal', function () {
        triggered += 1
        assert.strictEqual(triggered, 1, 'modal hide triggered once')
        done()
      })
      .bootstrapModal('show')
  })

  QUnit.test('should close reopened modal with [data-dismiss="modal"] click', function (assert) {
    var done = assert.async()

    $('<div id="modal-test"><div class="contents"><div id="close" data-dismiss="modal"/></div></div>')
      .one('shown.bs.modal', function () {
        $('#close').click()
      })
      .one('hidden.bs.modal', function () {
        // after one open-close cycle
        assert.ok(!$('#modal-test').is(':visible'), 'modal hidden')
        $(this)
          .one('shown.bs.modal', function () {
            $('#close').click()
          })
          .one('hidden.bs.modal', function () {
            assert.ok(!$('#modal-test').is(':visible'), 'modal hidden')
            done()
          })
          .bootstrapModal('show')
      })
      .bootstrapModal('show')
  })

  QUnit.test('should restore focus to toggling element when modal is hidden after having been opened via data-api', function (assert) {
    var done = assert.async()

    var $toggleBtn = $('<button data-toggle="modal" data-target="#modal-test"/>').appendTo('#qunit-fixture')

    $('<div id="modal-test"><div class="contents"><div id="close" data-dismiss="modal"/></div></div>')
      .on('hidden.bs.modal', function () {
        setTimeout(function () {
          assert.ok($(document.activeElement).is($toggleBtn), 'toggling element is once again focused')
          done()
        }, 0)
      })
      .on('shown.bs.modal', function () {
        $('#close').click()
      })
      .appendTo('#qunit-fixture')

    $toggleBtn.click()
  })

  QUnit.test('should not restore focus to toggling element if the associated show event gets prevented', function (assert) {
    var done = assert.async()
    var $toggleBtn = $('<button data-toggle="modal" data-target="#modal-test"/>').appendTo('#qunit-fixture')
    var $otherBtn = $('<button id="other-btn"/>').appendTo('#qunit-fixture')

    $('<div id="modal-test"><div class="contents"><div id="close" data-dismiss="modal"/></div>')
      .one('show.bs.modal', function (e) {
        e.preventDefault()
        $otherBtn.focus()
        setTimeout($.proxy(function () {
          $(this).bootstrapModal('show')
        }, this), 0)
      })
      .on('hidden.bs.modal', function () {
        setTimeout(function () {
          assert.ok($(document.activeElement).is($otherBtn), 'focus returned to toggling element')
          done()
        }, 0)
      })
      .on('shown.bs.modal', function () {
        $('#close').click()
      })
      .appendTo('#qunit-fixture')

    $toggleBtn.click()
  })
})
