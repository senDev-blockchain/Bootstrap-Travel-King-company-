import Util from '../util'

/**
 * --------------------------------------------------------------------------
 * Bootstrap (v4.0.0-beta): dom/eventHandler.js
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * --------------------------------------------------------------------------
 */

// defaultPrevented is broken in IE.
// https://connect.microsoft.com/IE/feedback/details/790389/event-defaultprevented-returns-false-after-preventdefault-was-called
const workingDefaultPrevented = (() => {
  const e = document.createEvent('CustomEvent')
  e.initEvent('Bootstrap', true, true)
  e.preventDefault()
  return e.defaultPrevented
})()

// CustomEvent polyfill for IE (see: https://mzl.la/2v76Zvn)
if (typeof window.CustomEvent !== 'function') {
  window.CustomEvent = (event, params) => {
    params = params || {
      bubbles: false,
      cancelable: false,
      detail: null
    }
    const evt = document.createEvent('CustomEvent')
    evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail)
    if (!workingDefaultPrevented) {
      const origPreventDefault = Event.prototype.preventDefault
      evt.preventDefault = () => {
        if (!evt.cancelable) {
          return
        }

        origPreventDefault.call(evt)
        Object.defineProperty(evt, 'defaultPrevented', {
          get() {
            return true
          },
          configurable: true
        })
      }
    }
    return evt
  }

  window.CustomEvent.prototype = window.Event.prototype
}

// Event constructor shim
if (!window.Event || typeof window.Event !== 'function') {
  const origEvent = window.Event
  window.Event = (inType, params) => {
    params = params || {}
    const e = document.createEvent('Event')
    e.initEvent(inType, Boolean(params.bubbles), Boolean(params.cancelable))
    return e
  }
  window.Event.prototype = origEvent.prototype
}

const namespaceRegex = /[^.]*(?=\..*)\.|.*/
const stripNameRegex = /\..*/
const keyEventRegex  = /^key/
const stripUidRegex  = /::\d+$/

// Events storage
const eventRegistry = {}
let uidEvent = 1

function getUidEvent(element, uid) {
  return element.uidEvent = uid && `${uid}::${uidEvent++}` || element.uidEvent || uidEvent++
}

function getEvent(element) {
  const uid = getUidEvent(element)
  return eventRegistry[uid] = eventRegistry[uid] || {}
}

const nativeEvents = [
  'click', 'dblclick', 'mouseup', 'mousedown', 'contextmenu',
  'mousewheel', 'DOMMouseScroll',
  'mouseover', 'mouseout', 'mousemove', 'selectstart', 'selectend',
  'keydown', 'keypress', 'keyup',
  'orientationchange',
  'touchstart', 'touchmove', 'touchend', 'touchcancel',
  'gesturestart', 'gesturechange', 'gestureend',
  'focus', 'blur', 'change', 'reset', 'select', 'submit', 'focusin', 'focusout',
  'load', 'unload', 'beforeunload', 'resize', 'move', 'DOMContentLoaded', 'readystatechange',
  'error', 'abort', 'scroll'
]

const customEvents = {
  mouseenter: 'mouseover',
  mouseleave: 'mouseout'
}

function fixEvent(event) {
  // Add which for key events
  if (event.which === null && keyEventRegex.test(event.type)) {
    event.which = event.charCode !== null ? event.charCode : event.keyCode
  }
  return event
}

function bootstrapHandler(element, fn) {
  return function (event) {
    event = fixEvent(event)
    return fn.apply(element, [event])
  }
}

function bootstrapDelegationHandler(element, selector, fn) {
  return function (event) {
    event = fixEvent(event)
    const domElements = element.querySelectorAll(selector)
    for (let target = event.target; target && target !== this; target = target.parentNode) {
      for (let i = domElements.length; i--;) {
        if (domElements[i] === target) {
          return fn.apply(target, [event])
        }
      }
    }
    // To please ESLint
    return null
  }
}

function removeHandler(element, events, typeEvent, handler) {
  const uidEvent = handler.uidEvent
  const fn = events[typeEvent][uidEvent]
  element.removeEventListener(typeEvent, fn, fn.delegation)
  delete events[typeEvent][uidEvent]
}

function removeNamespacedHandlers(element, events, typeEvent, namespace) {
  const storeElementEvent = events[typeEvent] || {}
  for (const handlerKey in storeElementEvent) {
    if (!Object.prototype.hasOwnProperty.call(storeElementEvent, handlerKey)) {
      continue
    }

    if (handlerKey.indexOf(namespace) > -1) {
      removeHandler(element, events, typeEvent, storeElementEvent[handlerKey].originalHandler)
    }
  }
}

const EventHandler = {
  on(element, originalTypeEvent, handler, delegationFn) {
    if (typeof originalTypeEvent !== 'string' ||
        (typeof element === 'undefined' || element === null)) {
      return
    }

    const delegation      = typeof handler === 'string'
    const originalHandler = delegation ? delegationFn : handler

    // allow to get the native events from namespaced events ('click.bs.button' --> 'click')
    let typeEvent = originalTypeEvent.replace(stripNameRegex, '')

    const custom = customEvents[typeEvent]
    if (custom) {
      typeEvent = custom
    }

    const isNative = nativeEvents.indexOf(typeEvent) > -1
    if (!isNative) {
      typeEvent = originalTypeEvent
    }
    const events    = getEvent(element)
    const handlers  = events[typeEvent] || (events[typeEvent] = {})
    const uid       = getUidEvent(originalHandler, originalTypeEvent.replace(namespaceRegex, ''))
    if (handlers[uid]) {
      return
    }

    const fn = !delegation ? bootstrapHandler(element, handler) : bootstrapDelegationHandler(element, handler, delegationFn)
    fn.isDelegation = delegation
    handlers[uid] = fn
    originalHandler.uidEvent = uid
    fn.originalHandler = originalHandler
    element.addEventListener(typeEvent, fn, delegation)
  },

  one(element, event, handler) {
    function complete(e) {
      EventHandler.off(element, event, complete)
      handler.apply(element, [e])
    }
    EventHandler.on(element, event, complete)
  },

  off(element, originalTypeEvent, handler) {
    if (typeof originalTypeEvent !== 'string' ||
       (typeof element === 'undefined' || element === null)) {
      return
    }

    const events      = getEvent(element)
    let typeEvent     = originalTypeEvent.replace(stripNameRegex, '')

    const inNamespace = typeEvent !== originalTypeEvent
    const custom      = customEvents[typeEvent]
    if (custom) {
      typeEvent = custom
    }

    const isNative = nativeEvents.indexOf(typeEvent) > -1
    if (!isNative) {
      typeEvent = originalTypeEvent
    }

    if (typeof handler !== 'undefined') {
      // Simplest case: handler is passed, remove that listener ONLY.
      if (!events || !events[typeEvent]) {
        return
      }

      removeHandler(element, events, typeEvent, handler)
      return
    }

    const isNamespace = originalTypeEvent.charAt(0) === '.'
    if (isNamespace) {
      for (const elementEvent in events) {
        if (!Object.prototype.hasOwnProperty.call(events, elementEvent)) {
          continue
        }

        removeNamespacedHandlers(element, events, elementEvent, originalTypeEvent.substr(1))
      }
    }

    const storeElementEvent = events[typeEvent] || {}
    for (const keyHandlers in storeElementEvent) {
      if (!Object.prototype.hasOwnProperty.call(storeElementEvent, keyHandlers)) {
        continue
      }

      const handlerKey = keyHandlers.replace(stripUidRegex, '')
      if (!inNamespace || originalTypeEvent.indexOf(handlerKey) > -1) {
        removeHandler(element, events, typeEvent, storeElementEvent[keyHandlers].originalHandler)
      }
    }
  },

  trigger(element, event, args) {
    if (typeof event !== 'string' ||
        (typeof element === 'undefined' || element === null)) {
      return null
    }

    const typeEvent   = event.replace(stripNameRegex, '')
    const inNamespace = event !== typeEvent
    const isNative    = nativeEvents.indexOf(typeEvent) > -1

    const $ = Util.jQuery
    let jQueryEvent

    let bubbles = true
    let nativeDispatch = true
    let defaultPrevented = false

    if (inNamespace && typeof $ !== 'undefined') {
      jQueryEvent = new $.Event(event, args)

      $(element).trigger(jQueryEvent)
      bubbles = !jQueryEvent.isPropagationStopped()
      nativeDispatch = !jQueryEvent.isImmediatePropagationStopped()
      defaultPrevented = jQueryEvent.isDefaultPrevented()
    }

    let evt           = null

    if (isNative) {
      evt = document.createEvent('HTMLEvents')
      evt.initEvent(typeEvent, true, true)
    } else {
      evt = new CustomEvent(event, {
        bubbles,
        cancelable: true
      })
    }

    // merge custom informations in our event
    if (typeof args !== 'undefined') {
      evt = Util.extend(evt, args)
    }

    if (defaultPrevented) {
      evt.preventDefault()
    }

    if (nativeDispatch) {
      element.dispatchEvent(evt)
    }

    if (evt.defaultPrevented && typeof jQueryEvent !== 'undefined') {
      jQueryEvent.preventDefault()
    }

    return evt
  }
}

// focusin and focusout polyfill
if (typeof window.onfocusin === 'undefined') {
  (() => {
    function listenerFocus(event) {
      EventHandler.trigger(event.target, 'focusin')
    }
    function listenerBlur(event) {
      EventHandler.trigger(event.target, 'focusout')
    }
    EventHandler.on(document, 'focus', 'input', listenerFocus)
    EventHandler.on(document, 'blur', 'input', listenerBlur)
  })()
}

export default EventHandler
