/* eslint-disable no-undef */
const assert = require('assert')
const { JSDOM } = require('jsdom')
const { h, view, mount, withTemplate, withLifecycle, withActions } = require('malina')
const { withRefs } = require('..')

describe('ref', () => {
  describe('withRef', () => {
    it('should handle ref funtions', done => {
      const dom = new JSDOM('<body></body>')

      const Test = view(
        withTemplate(({ actions }) =>
          h('div', {}, [
            h('span', { id: 'test', ref: actions.handleRef })
          ])
        ),
        withRefs(),
        withActions({
          handleRef: element => ({ state }) => {
            state.ref = element
          }
        }),
        withLifecycle({
          mount: ({ state }) => {
            assert(state.ref != null, 'Ref passed')
            assert.strictEqual(state.ref, dom.window.document.body.childNodes[0].childNodes[0])
          },
          unmount: ({ state }) => {
            assert(state.ref == null, 'Ref destroyed')
            done()
          }
        })
      )

      const instance = mount(dom.window.document.body, h(Test))

      assert.strictEqual(
        dom.window.document.body.innerHTML,
        '<div><span id="test"></span></div>'
      )

      instance.destroy()
    })

    it('should handle ref strings', done => {
      const dom = new JSDOM('<body></body>')

      const Test = view(
        withTemplate(({ actions }) =>
          h('div', {}, [
            h('span', { id: 'test', ref: 'ref' })
          ])
        ),
        withRefs(),
        withActions({
          handleRef: element => ({ state }) => {
            state.ref = element
          }
        }),
        withLifecycle({
          mount: ({ state }) => {
            assert(state.ref != null, 'Ref passed')
            assert.strictEqual(state.ref, dom.window.document.body.childNodes[0].childNodes[0])
          },
          unmount: ({ state }) => {
            assert(state.ref == null, 'Ref destroyed')
            done()
          }
        })
      )

      const instance = mount(dom.window.document.body, h(Test))

      assert.strictEqual(
        dom.window.document.body.innerHTML,
        '<div><span id="test"></span></div>'
      )

      instance.destroy()
    })
  })
})
