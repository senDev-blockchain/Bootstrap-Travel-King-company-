/**
 * --------------------------------------------------------------------------
 * Bootstrap (v5.0.0-beta2): tooltip.js
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
 * --------------------------------------------------------------------------
 */

import * as Popper from '@popperjs/core'

import {
  defineJQueryPlugin,
  emulateTransitionEnd,
  findShadowRoot,
  getTransitionDurationFromElement,
  getUID,
  isElement,
  isRTL,
  noop,
  typeCheckConfig
} from './util/index'
import {
  DefaultAllowlist,
  sanitizeHtml
} from './util/sanitizer'
import Data from './dom/data'
import EventHandler from './dom/event-handler'
import Manipulator from './dom/manipulator'
import SelectorEngine from './dom/selector-engine'
import BaseComponent from './base-component'

/**
 * ------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------
 */

const NAME = 'tooltip'
const DATA_KEY = 'bs.tooltip'
const EVENT_KEY = `.${DATA_KEY}`
const CLASS_PREFIX = 'bs-tooltip'
const BSCLS_PREFIX_REGEX = new RegExp(`(^|\\s)${CLASS_PREFIX}\\S+`, 'g')
const DISALLOWED_ATTRIBUTES = new Set(['sanitize', 'allowList', 'sanitizeFn'])

const DefaultType = {
  animation: 'boolean',
  template: 'string',
  title: '(string|element|function)',
  trigger: 'string',
  delay: '(number|object)',
  html: 'boolean',
  selector: '(string|boolean)',
  placement: '(string|function)',
  offset: '(array|string|function)',
  container: '(string|element|boolean)',
  fallbackPlacements: 'array',
  boundary: '(string|element)',
  customClass: '(string|function)',
  sanitize: 'boolean',
  sanitizeFn: '(null|function)',
  allowList: 'object',
  popperConfig: '(null|object|function)'
}

const AttachmentMap = {
  AUTO: 'auto',
  TOP: 'top',
  RIGHT: isRTL() ? 'left' : 'right',
  BOTTOM: 'bottom',
  LEFT: isRTL() ? 'right' : 'left'
}

const Default = {
  animation: true,
  template: '<div class="tooltip" role="tooltip">' +
              '<div class="tooltip-arrow"></div>' +
              '<div class="tooltip-inner"></div>' +
            '</div>',
  trigger: 'hover focus',
  title: '',
  delay: 0,
  html: false,
  selector: false,
  placement: 'top',
  offset: [0, 0],
  container: false,
  fallbackPlacements: ['top', 'right', 'bottom', 'left'],
  boundary: 'clippingParents',
  customClass: '',
  sanitize: true,
  sanitizeFn: null,
  allowList: DefaultAllowlist,
  popperConfig: null
}

const Event = {
  HIDE: `hide${EVENT_KEY}`,
  HIDDEN: `hidden${EVENT_KEY}`,
  SHOW: `show${EVENT_KEY}`,
  SHOWN: `shown${EVENT_KEY}`,
  INSERTED: `inserted${EVENT_KEY}`,
  CLICK: `click${EVENT_KEY}`,
  FOCUSIN: `focusin${EVENT_KEY}`,
  FOCUSOUT: `focusout${EVENT_KEY}`,
  MOUSEENTER: `mouseenter${EVENT_KEY}`,
  MOUSELEAVE: `mouseleave${EVENT_KEY}`
}

const CLASS_NAME_FADE = 'fade'
const CLASS_NAME_MODAL = 'modal'
const CLASS_NAME_SHOW = 'show'

const HOVER_STATE_SHOW = 'show'
const HOVER_STATE_OUT = 'out'

const SELECTOR_TOOLTIP_INNER = '.tooltip-inner'

const TRIGGER_HOVER = 'hover'
const TRIGGER_FOCUS = 'focus'
const TRIGGER_CLICK = 'click'
const TRIGGER_MANUAL = 'manual'

/**
 * ------------------------------------------------------------------------
 * Class Definition
 * ------------------------------------------------------------------------
 */

class Tooltip extends BaseComponent {
  constructor(element, config) {
    if (typeof Popper === 'undefined') {
      throw new TypeError('Bootstrap\'s tooltips require Popper (https://popper.js.org)')
    }

    super(element)

    // private
    this._isEnabled = true
    this._timeout = 0
    this._hoverState = ''
    this._activeTrigger = {}
    this._popper = null

    // Protected
    this.config = this._getConfig(config)
    this.tip = null

    this._setListeners()
  }

  // Getters

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

  static get EVENT_KEY() {
    return EVENT_KEY
  }

  static get DefaultType() {
    return DefaultType
  }

  // Public

  enable() {
    this._isEnabled = true
  }

  disable() {
    this._isEnabled = false
  }

  toggleEnabled() {
    this._isEnabled = !this._isEnabled
  }

  toggle(event) {
    if (!this._isEnabled) {
      return
    }

    if (event) {
      const context = this._initializeOnDelegatedTarget(event)

      context._activeTrigger.click = !context._activeTrigger.click

      if (context._isWithActiveTrigger()) {
        context._enter(null, context)
      } else {
        context._leave(null, context)
      }
    } else {
      if (this.getTipElement().classList.contains(CLASS_NAME_SHOW)) {
        this._leave(null, this)
        return
      }

      this._enter(null, this)
    }
  }

  dispose() {
    clearTimeout(this._timeout)

    EventHandler.off(this._element, this.constructor.EVENT_KEY)
    EventHandler.off(this._element.closest(`.${CLASS_NAME_MODAL}`), 'hide.bs.modal', this._hideModalHandler)

    if (this.tip && this.tip.parentNode) {
      this.tip.parentNode.removeChild(this.tip)
    }

    this._isEnabled = null
    this._timeout = null
    this._hoverState = null
    this._activeTrigger = null
    if (this._popper) {
      this._popper.destroy()
    }

    this._popper = null
    this.config = null
    this.tip = null
    super.dispose()
  }

  show() {
    if (this._element.style.display === 'none') {
      throw new Error('Please use show on visible elements')
    }

    if (!(this.isWithContent() && this._isEnabled)) {
      return
    }

    const showEvent = EventHandler.trigger(this._element, this.constructor.Event.SHOW)
    const shadowRoot = findShadowRoot(this._element)
    const isInTheDom = shadowRoot === null ?
      this._element.ownerDocument.documentElement.contains(this._element) :
      shadowRoot.contains(this._element)

    if (showEvent.defaultPrevented || !isInTheDom) {
      return
    }

    const tip = this.getTipElement()
    const tipId = getUID(this.constructor.NAME)

    tip.setAttribute('id', tipId)
    this._element.setAttribute('aria-describedby', tipId)

    this.setContent()

    if (this.config.animation) {
      tip.classList.add(CLASS_NAME_FADE)
    }

    const placement = typeof this.config.placement === 'function' ?
      this.config.placement.call(this, tip, this._element) :
      this.config.placement

    const attachment = this._getAttachment(placement)
    this._addAttachmentClass(attachment)

    const container = this._getContainer()
    Data.set(tip, this.constructor.DATA_KEY, this)

    if (!this._element.ownerDocument.documentElement.contains(this.tip)) {
      container.appendChild(tip)
    }

    EventHandler.trigger(this._element, this.constructor.Event.INSERTED)

    if (this._popper) {
      this._popper.update()
    } else {
      this._popper = Popper.createPopper(this._element, tip, this._getPopperConfig(attachment))
    }

    tip.classList.add(CLASS_NAME_SHOW)

    const customClass = typeof this.config.customClass === 'function' ? this.config.customClass() : this.config.customClass
    if (customClass) {
      tip.classList.add(...customClass.split(' '))
    }

    // If this is a touch-enabled device we add extra
    // empty mouseover listeners to the body's immediate children;
    // only needed because of broken event delegation on iOS
    // https://www.quirksmode.org/blog/archives/2014/02/mouse_event_bub.html
    if ('ontouchstart' in document.documentElement) {
      [].concat(...document.body.children).forEach(element => {
        EventHandler.on(element, 'mouseover', noop())
      })
    }

    const complete = () => {
      const prevHoverState = this._hoverState

      this._hoverState = null
      EventHandler.trigger(this._element, this.constructor.Event.SHOWN)

      if (prevHoverState === HOVER_STATE_OUT) {
        this._leave(null, this)
      }
    }

    if (this.tip.classList.contains(CLASS_NAME_FADE)) {
      const transitionDuration = getTransitionDurationFromElement(this.tip)
      EventHandler.one(this.tip, 'transitionend', complete)
      emulateTransitionEnd(this.tip, transitionDuration)
    } else {
      complete()
    }
  }

  hide() {
    if (!this._popper) {
      return
    }

    const tip = this.getTipElement()
    const complete = () => {
      if (this._isWithActiveTrigger()) {
        return
      }

      if (this._hoverState !== HOVER_STATE_SHOW && tip.parentNode) {
        tip.parentNode.removeChild(tip)
      }

      this._cleanTipClass()
      this._element.removeAttribute('aria-describedby')
      EventHandler.trigger(this._element, this.constructor.Event.HIDDEN)

      if (this._popper) {
        this._popper.destroy()
        this._popper = null
      }
    }

    const hideEvent = EventHandler.trigger(this._element, this.constructor.Event.HIDE)
    if (hideEvent.defaultPrevented) {
      return
    }

    tip.classList.remove(CLASS_NAME_SHOW)

    // If this is a touch-enabled device we remove the extra
    // empty mouseover listeners we added for iOS support
    if ('ontouchstart' in document.documentElement) {
      [].concat(...document.body.children)
        .forEach(element => EventHandler.off(element, 'mouseover', noop))
    }

    this._activeTrigger[TRIGGER_CLICK] = false
    this._activeTrigger[TRIGGER_FOCUS] = false
    this._activeTrigger[TRIGGER_HOVER] = false

    if (this.tip.classList.contains(CLASS_NAME_FADE)) {
      const transitionDuration = getTransitionDurationFromElement(tip)

      EventHandler.one(tip, 'transitionend', complete)
      emulateTransitionEnd(tip, transitionDuration)
    } else {
      complete()
    }

    this._hoverState = ''
  }

  update() {
    if (this._popper !== null) {
      this._popper.update()
    }
  }

  // Protected

  isWithContent() {
    return Boolean(this.getTitle())
  }

  getTipElement() {
    if (this.tip) {
      return this.tip
    }

    const element = document.createElement('div')
    element.innerHTML = this.config.template

    this.tip = element.children[0]
    return this.tip
  }

  setContent() {
    const tip = this.getTipElement()
    this.setElementContent(SelectorEngine.findOne(SELECTOR_TOOLTIP_INNER, tip), this.getTitle())
    tip.classList.remove(CLASS_NAME_FADE, CLASS_NAME_SHOW)
  }

  setElementContent(element, content) {
    if (element === null) {
      return
    }

    if (typeof content === 'object' && isElement(content)) {
      if (content.jquery) {
        content = content[0]
      }

      // content is a DOM node or a jQuery
      if (this.config.html) {
        if (content.parentNode !== element) {
          element.innerHTML = ''
          element.appendChild(content)
        }
      } else {
        element.textContent = content.textContent
      }

      return
    }

    if (this.config.html) {
      if (this.config.sanitize) {
        content = sanitizeHtml(content, this.config.allowList, this.config.sanitizeFn)
      }

      element.innerHTML = content
    } else {
      element.textContent = content
    }
  }

  getTitle() {
    let title = this._element.getAttribute('data-bs-original-title')

    if (!title) {
      title = typeof this.config.title === 'function' ?
        this.config.title.call(this._element) :
        this.config.title
    }

    return title
  }

  updateAttachment(attachment) {
    if (attachment === 'right') {
      return 'end'
    }

    if (attachment === 'left') {
      return 'start'
    }

    return attachment
  }

  // Private

  _initializeOnDelegatedTarget(event, context) {
    const dataKey = this.constructor.DATA_KEY
    context = context || Data.get(event.delegateTarget, dataKey)

    if (!context) {
      context = new this.constructor(event.delegateTarget, this._getDelegateConfig())
      Data.set(event.delegateTarget, dataKey, context)
    }

    return context
  }

  _getOffset() {
    const { offset } = this.config

    if (typeof offset === 'string') {
      return offset.split(',').map(val => Number.parseInt(val, 10))
    }

    if (typeof offset === 'function') {
      return popperData => offset(popperData, this._element)
    }

    return offset
  }

  _getPopperConfig(attachment) {
    const defaultBsPopperConfig = {
      placement: attachment,
      modifiers: [
        {
          name: 'flip',
          options: {
            altBoundary: true,
            fallbackPlacements: this.config.fallbackPlacements
          }
        },
        {
          name: 'offset',
          options: {
            offset: this._getOffset()
          }
        },
        {
          name: 'preventOverflow',
          options: {
            boundary: this.config.boundary
          }
        },
        {
          name: 'arrow',
          options: {
            element: `.${this.constructor.NAME}-arrow`
          }
        },
        {
          name: 'onChange',
          enabled: true,
          phase: 'afterWrite',
          fn: data => this._handlePopperPlacementChange(data)
        }
      ],
      onFirstUpdate: data => {
        if (data.options.placement !== data.placement) {
          this._handlePopperPlacementChange(data)
        }
      }
    }

    return {
      ...defaultBsPopperConfig,
      ...(typeof this.config.popperConfig === 'function' ? this.config.popperConfig(defaultBsPopperConfig) : this.config.popperConfig)
    }
  }

  _addAttachmentClass(attachment) {
    this.getTipElement().classList.add(`${CLASS_PREFIX}-${this.updateAttachment(attachment)}`)
  }

  _getContainer() {
    if (this.config.container === false) {
      return document.body
    }

    if (isElement(this.config.container)) {
      return this.config.container
    }

    return SelectorEngine.findOne(this.config.container)
  }

  _getAttachment(placement) {
    return AttachmentMap[placement.toUpperCase()]
  }

  _setListeners() {
    const triggers = this.config.trigger.split(' ')

    triggers.forEach(trigger => {
      if (trigger === 'click') {
        EventHandler.on(this._element, this.constructor.Event.CLICK, this.config.selector, event => this.toggle(event))
      } else if (trigger !== TRIGGER_MANUAL) {
        const eventIn = trigger === TRIGGER_HOVER ?
          this.constructor.Event.MOUSEENTER :
          this.constructor.Event.FOCUSIN
        const eventOut = trigger === TRIGGER_HOVER ?
          this.constructor.Event.MOUSELEAVE :
          this.constructor.Event.FOCUSOUT

        EventHandler.on(this._element, eventIn, this.config.selector, event => this._enter(event))
        EventHandler.on(this._element, eventOut, this.config.selector, event => this._leave(event))
      }
    })

    this._hideModalHandler = () => {
      if (this._element) {
        this.hide()
      }
    }

    EventHandler.on(this._element.closest(`.${CLASS_NAME_MODAL}`), 'hide.bs.modal', this._hideModalHandler)

    if (this.config.selector) {
      this.config = {
        ...this.config,
        trigger: 'manual',
        selector: ''
      }
    } else {
      this._fixTitle()
    }
  }

  _fixTitle() {
    const title = this._element.getAttribute('title')
    const originalTitleType = typeof this._element.getAttribute('data-bs-original-title')

    if (title || originalTitleType !== 'string') {
      this._element.setAttribute('data-bs-original-title', title || '')
      if (title && !this._element.getAttribute('aria-label') && !this._element.textContent) {
        this._element.setAttribute('aria-label', title)
      }

      this._element.setAttribute('title', '')
    }
  }

  _enter(event, context) {
    context = this._initializeOnDelegatedTarget(event, context)

    if (event) {
      context._activeTrigger[
        event.type === 'focusin' ? TRIGGER_FOCUS : TRIGGER_HOVER
      ] = true
    }

    if (context.getTipElement().classList.contains(CLASS_NAME_SHOW) || context._hoverState === HOVER_STATE_SHOW) {
      context._hoverState = HOVER_STATE_SHOW
      return
    }

    clearTimeout(context._timeout)

    context._hoverState = HOVER_STATE_SHOW

    if (!context.config.delay || !context.config.delay.show) {
      context.show()
      return
    }

    context._timeout = setTimeout(() => {
      if (context._hoverState === HOVER_STATE_SHOW) {
        context.show()
      }
    }, context.config.delay.show)
  }

  _leave(event, context) {
    context = this._initializeOnDelegatedTarget(event, context)

    if (event) {
      context._activeTrigger[
        event.type === 'focusout' ? TRIGGER_FOCUS : TRIGGER_HOVER
      ] = context._element.contains(event.relatedTarget)
    }

    if (context._isWithActiveTrigger()) {
      return
    }

    clearTimeout(context._timeout)

    context._hoverState = HOVER_STATE_OUT

    if (!context.config.delay || !context.config.delay.hide) {
      context.hide()
      return
    }

    context._timeout = setTimeout(() => {
      if (context._hoverState === HOVER_STATE_OUT) {
        context.hide()
      }
    }, context.config.delay.hide)
  }

  _isWithActiveTrigger() {
    for (const trigger in this._activeTrigger) {
      if (this._activeTrigger[trigger]) {
        return true
      }
    }

    return false
  }

  _getConfig(config) {
    const dataAttributes = Manipulator.getDataAttributes(this._element)

    Object.keys(dataAttributes).forEach(dataAttr => {
      if (DISALLOWED_ATTRIBUTES.has(dataAttr)) {
        delete dataAttributes[dataAttr]
      }
    })

    if (config && typeof config.container === 'object' && config.container.jquery) {
      config.container = config.container[0]
    }

    config = {
      ...this.constructor.Default,
      ...dataAttributes,
      ...(typeof config === 'object' && config ? config : {})
    }

    if (typeof config.delay === 'number') {
      config.delay = {
        show: config.delay,
        hide: config.delay
      }
    }

    if (typeof config.title === 'number') {
      config.title = config.title.toString()
    }

    if (typeof config.content === 'number') {
      config.content = config.content.toString()
    }

    typeCheckConfig(NAME, config, this.constructor.DefaultType)

    if (config.sanitize) {
      config.template = sanitizeHtml(config.template, config.allowList, config.sanitizeFn)
    }

    return config
  }

  _getDelegateConfig() {
    const config = {}

    if (this.config) {
      for (const key in this.config) {
        if (this.constructor.Default[key] !== this.config[key]) {
          config[key] = this.config[key]
        }
      }
    }

    return config
  }

  _cleanTipClass() {
    const tip = this.getTipElement()
    const tabClass = tip.getAttribute('class').match(BSCLS_PREFIX_REGEX)
    if (tabClass !== null && tabClass.length > 0) {
      tabClass.map(token => token.trim())
        .forEach(tClass => tip.classList.remove(tClass))
    }
  }

  _handlePopperPlacementChange(popperData) {
    const { state } = popperData

    if (!state) {
      return
    }

    this.tip = state.elements.popper
    this._cleanTipClass()
    this._addAttachmentClass(this._getAttachment(state.placement))
  }

  // Static

  static jQueryInterface(config) {
    return this.each(function () {
      let data = Data.get(this, DATA_KEY)
      const _config = typeof config === 'object' && config

      if (!data && /dispose|hide/.test(config)) {
        return
      }

      if (!data) {
        data = new Tooltip(this, _config)
      }

      if (typeof config === 'string') {
        if (typeof data[config] === 'undefined') {
          throw new TypeError(`No method named "${config}"`)
        }

        data[config]()
      }
    })
  }
}

/**
 * ------------------------------------------------------------------------
 * jQuery
 * ------------------------------------------------------------------------
 * add .Tooltip to jQuery only if jQuery is present
 */

defineJQueryPlugin(NAME, Tooltip)

export default Tooltip
