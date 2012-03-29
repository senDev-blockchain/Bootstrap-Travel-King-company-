/* ===================================================
 * bootstrap-transition.js v2.0.2
 * http://twitter.github.com/bootstrap/javascript.html#transitions
 * ===================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */


!function ( $ ) {

  $(function () {

    "use strict"

    /* CSS TRANSITION SUPPORT (technique from http://www.modernizr.com/)
     * ======================================================= */

    $.support.transition = (function () {

      var thisBody = document.body || document.documentElement
        , thisStyle = thisBody.style
        , support = thisStyle.transition !== undefined || thisStyle.WebkitTransition !== undefined || thisStyle.MozTransition !== undefined || thisStyle.MsTransition !== undefined || thisStyle.OTransition !== undefined

      return support && {
        end: (function () {
          var el = document.createElement('bootstrap')
            , transEndEventNames = {
                 'WebkitTransition' : 'webkitTransitionEnd'
              ,  'MozTransition'    : 'transitionend'
              ,  'OTransition'      : 'oTransitionEnd'
              ,  'msTransition'     : 'MsTransitionEnd'
              ,  'transition'       : 'transitionend'
              }
            , name

          for (name in transEndEventNames){
            if (el.style[name] !== undefined) {
              return transEndEventNames[name]
            }
          }

        }())

      }
    })()

  })

}( window.jQuery );