import 'popper.js'
import { Tooltip } from '../../../dist/js/bootstrap.esm.js'

window.addEventListener('load', () => {
  [...document.querySelectorAll('[data-bs-toggle="tooltip"]')]
    .map(tooltipNode => new Tooltip(tooltipNode))
})
