import Tooltip from './tooltip'


/**
 * --------------------------------------------------------------------------
 * Bootstrap (v4.0.0): popover.js
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * --------------------------------------------------------------------------
 */

const Popover = (($) => {


  /**
   * ------------------------------------------------------------------------
   * Constants
   * ------------------------------------------------------------------------
   */

  const NAME                = 'popover'
  const VERSION             = '4.0.0'
  const DATA_KEY            = 'bs.popover'
  const JQUERY_NO_CONFLICT  = $.fn[NAME]

  const Default = $.extend({}, Tooltip.Default, {
    placement : 'right',
    trigger   : 'click',
    content   : '',
    template  : '<div class="popover" role="tooltip">'
              + '<div class="popover-arrow"></div>'
              + '<h3 class="popover-title"></h3>'
              + '<div class="popover-content"></div></div>'
  })

  const ClassName = {
    FADE : 'fade',
    IN  : 'in'
  }

  const Selector = {
    TITLE   : '.popover-title',
    CONTENT : '.popover-content',
    ARROW   : '.popover-arrow'
  }

  const Event = {
    HIDE       : 'hide.bs.popover',
    HIDDEN     : 'hidden.bs.popover',
    SHOW       : 'show.bs.popover',
    SHOWN      : 'shown.bs.popover',
    INSERTED   : 'inserted.bs.popover',
    CLICK      : 'click.bs.popover',
    FOCUSIN    : 'focusin.bs.popover',
    FOCUSOUT   : 'focusout.bs.popover',
    MOUSEENTER : 'mouseenter.bs.popover',
    MOUSELEAVE : 'mouseleave.bs.popover'
  }


  /**
   * ------------------------------------------------------------------------
   * Class Definition
   * ------------------------------------------------------------------------
   */

  class Popover extends Tooltip {


    // getters

    static get VERSION() {
      return VERSION
    }

    static get Default() {
      return Default
    }

    static get NAME() {
      return NAME
    }

    static get DATA_KEY() {
      return DATA_KEY
    }

    static get Event() {
      return Event
    }


    // overrides

    isWithContent() {
      return this.getTitle() || this._getContent()
    }

    getTipElement() {
      return (this.tip = this.tip || $(this.config.template)[0])
    }

    setContent() {
      let tip          = this.getTipElement()
      let title        = this.getTitle()
      let content      = this._getContent()
      let titleElement = $(tip).find(Selector.TITLE)[0]

      if (titleElement) {
        titleElement[
          this.config.html ? 'innerHTML' : 'innerText'
        ] = title
      }

      // we use append for html objects to maintain js events
      $(tip).find(Selector.CONTENT).children().detach().end()[
        this.config.html ?
          (typeof content === 'string' ? 'html' : 'append') : 'text'
      ](content)

      $(tip)
        .removeClass(ClassName.FADE)
        .removeClass(ClassName.IN)

      this.cleanupTether()
    }

    // private

    _getContent() {
      return this.element.getAttribute('data-content')
        || (typeof this.config.content == 'function' ?
              this.config.content.call(this.element) :
              this.config.content)
    }


    // static

    static _jQueryInterface(config) {
      return this.each(function () {
        let data   = $(this).data(DATA_KEY)
        let _config = typeof config === 'object' ? config : null

        if (!data && /destroy|hide/.test(config)) {
          return
        }

        if (!data) {
          data = new Popover(this, _config)
          $(this).data(DATA_KEY, data)
        }

        if (typeof config === 'string') {
          data[config]()
        }
      })
    }
  }


  /**
   * ------------------------------------------------------------------------
   * jQuery
   * ------------------------------------------------------------------------
   */

  $.fn[NAME]             = Popover._jQueryInterface
  $.fn[NAME].Constructor = Popover
  $.fn[NAME].noConflict  = function () {
    $.fn[NAME] = JQUERY_NO_CONFLICT
    return Popover._jQueryInterface
  }

  return Popover

})(jQuery)

export default Popover
