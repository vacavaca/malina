/* eslint-disable no-undef */
const assert = require('assert')
const { JSDOM } = require('jsdom')
const { h, view, mount } = require('malina')
const { mapState } = require('..')

describe('common', () => {
  describe('mapState', () => {
    it('should map state passed from the outer views', () => {
      const dom = new JSDOM('<body></body>')

      const Test = view(({ state }) => h('p', {}, `${state.test}`))
        .decorate(mapState(state => ({
          test: state.test + 1
        })))

      mount(dom.window.document.body, h(Test, { test: 42 }))

      assert.strictEqual(
        dom.window.document.body.innerHTML,
        '<p>43</p>'
      )
    })
  })
})
