import Util from './util'


/**
 * --------------------------------------------------------------------------
 * Bootstrap (v4.0.0-alpha.5): carousel.js
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * --------------------------------------------------------------------------
 */

const Carousel = (($) => {


  /**
   * ------------------------------------------------------------------------
   * Constants
   * ------------------------------------------------------------------------
   */

  const NAME                = 'carousel'
  const VERSION             = '4.0.0-alpha.5'
  const DATA_KEY            = 'bs.carousel'
  const EVENT_KEY           = `.${DATA_KEY}`
  const DATA_API_KEY        = '.data-api'
  const JQUERY_NO_CONFLICT  = $.fn[NAME]
  const TRANSITION_DURATION = 600
  const ARROW_LEFT_KEYCODE  = 37 // KeyboardEvent.which value for left arrow key
  const ARROW_RIGHT_KEYCODE = 39 // KeyboardEvent.which value for right arrow key

  const Default = {
    interval : 5000,
    keyboard : true,
    slide    : false,
    pause    : 'hover',
    wrap     : true
  }

  const DefaultType = {
    interval : '(number|boolean)',
    keyboard : 'boolean',
    slide    : '(boolean|string)',
    pause    : '(string|boolean)',
    wrap     : 'boolean'
  }

  const Direction = {
    NEXT     : 'next',
    PREV     : 'prev',
    LEFT     : 'left',
    RIGHT    : 'right'
  }

  const Event = {
    SLIDE          : `slide${EVENT_KEY}`,
    SLID           : `slid${EVENT_KEY}`,
    KEYDOWN        : `keydown${EVENT_KEY}`,
    MOUSEENTER     : `mouseenter${EVENT_KEY}`,
    MOUSELEAVE     : `mouseleave${EVENT_KEY}`,
    LOAD_DATA_API  : `load${EVENT_KEY}${DATA_API_KEY}`,
    CLICK_DATA_API : `click${EVENT_KEY}${DATA_API_KEY}`
  }

  const ClassName = {
    CAROUSEL : 'carousel',
    ACTIVE   : 'active',
    SLIDE    : 'slide',
    RIGHT    : 'carousel-item-right',
    LEFT     : 'carousel-item-left',
    NEXT     : 'carousel-item-next',
    PREV     : 'carousel-item-prev',
    ITEM     : 'carousel-item'
  }

  const Selector = {
    ACTIVE      : '.active',
    ACTIVE_ITEM : '.active.carousel-item',
    ITEM        : '.carousel-item',
    NEXT_PREV   : '.carousel-item-next, .carousel-item-prev',
    INDICATORS  : '.carousel-indicators',
    DATA_SLIDE  : '[data-slide], [data-slide-to]',
    DATA_RIDE   : '[data-ride="carousel"]'
  }


  /**
   * ------------------------------------------------------------------------
   * Class Definition
   * ------------------------------------------------------------------------
   */

  class Carousel {

    constructor(element, config) {
      this._items             = null
      this._interval          = null
      this._activeElement     = null

      this._isPaused          = false
      this._isSliding         = false

      this._config            = this._getConfig(config)
      this._element           = $(element)[0]
      this._indicatorsElement = $(this._element).find(Selector.INDICATORS)[0]

      this._addEventListeners()
    }


    // getters

    static get VERSION() {
      return VERSION
    }

    static get Default() {
      return Default
    }


    // public

    next() {
      if (!this._isSliding) {
        this._slide(Direction.NEXT)
      }
    }

    nextWhenVisible() {
      // Don't call next when the page isn't visible
      if (!document.hidden) {
        this.next()
      }
    }

    prev() {
      if (!this._isSliding) {
        this._slide(Direction.PREVIOUS)
      }
    }

    pause(event) {
      if (!event) {
        this._isPaused = true
      }

      if ($(this._element).find(Selector.NEXT_PREV)[0] &&
        Util.supportsTransitionEnd()) {
        Util.triggerTransitionEnd(this._element)
        this.cycle(true)
      }

      clearInterval(this._interval)
      this._interval = null
    }

    cycle(event) {
      if (!event) {
        this._isPaused = false
      }

      if (this._interval) {
        clearInterval(this._interval)
        this._interval = null
      }

      if (this._config.interval && !this._isPaused) {
        this._interval = setInterval(
          (document.visibilityState ? this.nextWhenVisible : this.next).bind(this),
          this._config.interval
        )
      }
    }

    to(index) {
      this._activeElement = $(this._element).find(Selector.ACTIVE_ITEM)[0]

      const activeIndex = this._getItemIndex(this._activeElement)

      if (index > this._items.length - 1 || index < 0) {
        return
      }

      if (this._isSliding) {
        $(this._element).one(Event.SLID, () => this.to(index))
        return
      }

      if (activeIndex === index) {
        this.pause()
        this.cycle()
        return
      }

      const direction = index > activeIndex ?
        Direction.NEXT :
        Direction.PREVIOUS

      this._slide(direction, this._items[index])
    }

    dispose() {
      $(this._element).off(EVENT_KEY)
      $.removeData(this._element, DATA_KEY)

      this._items             = null
      this._config            = null
      this._element           = null
      this._interval          = null
      this._isPaused          = null
      this._isSliding         = null
      this._activeElement     = null
      this._indicatorsElement = null
    }


    // private

    _getConfig(config) {
      config = $.extend({}, Default, config)
      Util.typeCheckConfig(NAME, config, DefaultType)
      return config
    }

    _addEventListeners() {
      if (this._config.keyboard) {
        $(this._element)
          .on(Event.KEYDOWN, (event) => this._keydown(event))
      }

      if (this._config.pause === 'hover' &&
        !('ontouchstart' in document.documentElement)) {
        $(this._element)
          .on(Event.MOUSEENTER, (event) => this.pause(event))
          .on(Event.MOUSELEAVE, (event) => this.cycle(event))
      }
    }

    _keydown(event) {
      event.preventDefault()

      if (/input|textarea/i.test(event.target.tagName)) {
        return
      }

      switch (event.which) {
        case ARROW_LEFT_KEYCODE:
          this.prev()
          break
        case ARROW_RIGHT_KEYCODE:
          this.next()
          break
        default:
          return
      }
    }

    _getItemIndex(element) {
      this._items = $.makeArray($(element).parent().find(Selector.ITEM))
      return this._items.indexOf(element)
    }

    _getItemByDirection(direction, activeElement) {
      const isNextDirection = direction === Direction.NEXT
      const isPrevDirection = direction === Direction.PREVIOUS
      const activeIndex     = this._getItemIndex(activeElement)
      const lastItemIndex   = this._items.length - 1
      const isGoingToWrap   = isPrevDirection && activeIndex === 0 ||
                              isNextDirection && activeIndex === lastItemIndex

      if (isGoingToWrap && !this._config.wrap) {
        return activeElement
      }

      const delta     = direction === Direction.PREVIOUS ? -1 : 1
      const itemIndex = (activeIndex + delta) % this._items.length

      return itemIndex === -1 ?
        this._items[this._items.length - 1] : this._items[itemIndex]
    }


    _triggerSlideEvent(relatedTarget, eventDirectionName) {
      const slideEvent = $.Event(Event.SLIDE, {
        relatedTarget,
        direction: eventDirectionName
      })

      $(this._element).trigger(slideEvent)

      return slideEvent
    }

    _setActiveIndicatorElement(element) {
      if (this._indicatorsElement) {
        $(this._indicatorsElement)
          .find(Selector.ACTIVE)
          .removeClass(ClassName.ACTIVE)

        const nextIndicator = this._indicatorsElement.children[
          this._getItemIndex(element)
        ]

        if (nextIndicator) {
          $(nextIndicator).addClass(ClassName.ACTIVE)
        }
      }
    }

    _slide(direction, element) {
      const activeElement = $(this._element).find(Selector.ACTIVE_ITEM)[0]
      const nextElement   = element || activeElement &&
        this._getItemByDirection(direction, activeElement)

      const isCycling = Boolean(this._interval)

      let directionalClassName
      let orderClassName
      let eventDirectionName

      if (direction === Direction.NEXT) {
        directionalClassName = ClassName.LEFT
        orderClassName = ClassName.NEXT
        eventDirectionName = Direction.LEFT
      } else {
        directionalClassName = ClassName.RIGHT
        orderClassName = ClassName.PREV
        eventDirectionName = Direction.RIGHT
      }

      // const directionalClassName = direction === Direction.NEXT ?
      //   ClassName.LEFT :
      //   ClassName.RIGHT

      if (nextElement && $(nextElement).hasClass(ClassName.ACTIVE)) {
        this._isSliding = false
        return
      }

      const slideEvent = this._triggerSlideEvent(nextElement, eventDirectionName)
      if (slideEvent.isDefaultPrevented()) {
        return
      }

      if (!activeElement || !nextElement) {
        // some weirdness is happening, so we bail
        return
      }

      this._isSliding = true

      if (isCycling) {
        this.pause()
      }

      this._setActiveIndicatorElement(nextElement)

      const slidEvent = $.Event(Event.SLID, {
        relatedTarget: nextElement,
        direction: eventDirectionName
      })

      if (Util.supportsTransitionEnd() &&
        $(this._element).hasClass(ClassName.SLIDE)) {

        $(nextElement).addClass(orderClassName)

        Util.reflow(nextElement)

        $(activeElement).addClass(directionalClassName)
        $(nextElement).addClass(directionalClassName)

        $(activeElement)
          .one(Util.TRANSITION_END, () => {
            $(nextElement)
              .removeClass(directionalClassName)
              .removeClass(orderClassName)

            $(nextElement).addClass(ClassName.ACTIVE)

            $(activeElement)
              .removeClass(ClassName.ACTIVE)
              .removeClass(orderClassName)
              .removeClass(directionalClassName)

            this._isSliding = false

            setTimeout(() => $(this._element).trigger(slidEvent), 0)

          })
          .emulateTransitionEnd(TRANSITION_DURATION)

      } else {
        $(activeElement).removeClass(ClassName.ACTIVE)
        $(nextElement).addClass(ClassName.ACTIVE)

        this._isSliding = false
        $(this._element).trigger(slidEvent)
      }

      if (isCycling) {
        this.cycle()
      }
    }


    // static

    static _jQueryInterface(config) {
      return this.each(function () {
        let data      = $(this).data(DATA_KEY)
        const _config = $.extend({}, Default, $(this).data())

        if (typeof config === 'object') {
          $.extend(_config, config)
        }

        const action = typeof config === 'string' ? config : _config.slide

        if (!data) {
          data = new Carousel(this, _config)
          $(this).data(DATA_KEY, data)
        }

        if (typeof config === 'number') {
          data.to(config)
        } else if (typeof action === 'string') {
          if (data[action] === undefined) {
            throw new Error(`No method named "${action}"`)
          }
          data[action]()
        } else if (_config.interval) {
          data.pause()
          data.cycle()
        }
      })
    }

    static _dataApiClickHandler(event) {
      const selector = Util.getSelectorFromElement(this)

      if (!selector) {
        return
      }

      const target = $(selector)[0]

      if (!target || !$(target).hasClass(ClassName.CAROUSEL)) {
        return
      }

      const config     = $.extend({}, $(target).data(), $(this).data())
      const slideIndex = this.getAttribute('data-slide-to')

      if (slideIndex) {
        config.interval = false
      }

      Carousel._jQueryInterface.call($(target), config)

      if (slideIndex) {
        $(target).data(DATA_KEY).to(slideIndex)
      }

      event.preventDefault()
    }

  }


  /**
   * ------------------------------------------------------------------------
   * Data Api implementation
   * ------------------------------------------------------------------------
   */

  $(document)
    .on(Event.CLICK_DATA_API, Selector.DATA_SLIDE, Carousel._dataApiClickHandler)

  $(window).on(Event.LOAD_DATA_API, () => {
    $(Selector.DATA_RIDE).each(function () {
      const $carousel = $(this)
      Carousel._jQueryInterface.call($carousel, $carousel.data())
    })
  })


  /**
   * ------------------------------------------------------------------------
   * jQuery
   * ------------------------------------------------------------------------
   */

  $.fn[NAME]             = Carousel._jQueryInterface
  $.fn[NAME].Constructor = Carousel
  $.fn[NAME].noConflict  = function () {
    $.fn[NAME] = JQUERY_NO_CONFLICT
    return Carousel._jQueryInterface
  }

  return Carousel

})(jQuery)

export default Carousel
