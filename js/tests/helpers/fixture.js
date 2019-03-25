const fixtureId = 'fixture'

export const getFixture = () => {
  let fixtureEl = document.getElementById(fixtureId)

  if (!fixtureEl) {
    fixtureEl = document.createElement('div')
    fixtureEl.setAttribute('id', fixtureId)
    fixtureEl.style.display = 'none'
    document.body.appendChild(fixtureEl)
  }

  return fixtureEl
}

export const clearFixture = () => {
  const fixtureEl = getFixture()

  fixtureEl.innerHTML = ''
}

export const createEvent = (eventName, params) => {
  params = params || {}
  const e = document.createEvent('Event')

  e.initEvent(eventName, Boolean(params.bubbles), Boolean(params.cancelable))
  return e
}

export const jQueryMock = {
  elements: undefined,
  fn: {},
  each(fn) {
    this.elements.forEach(el => {
      fn.call(el)
    })
  }
}
