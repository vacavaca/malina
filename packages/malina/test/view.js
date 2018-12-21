/* eslint-disable no-undef */
const assert = require('assert')
const { JSDOM } = require('jsdom')
const { h, view, mount } = require('..')

describe('view', () => {
  describe('update', () => {
    it('should add new children while updating', () => {
      const dom = new JSDOM('<body></body>')

      const increment = () => ({ childCount }) => ({
        childCount: childCount + 1
      })

      const Test = view(({ childCount }) => {
        const children = []
        for (let i = 1; i <= childCount; i++) {
          children.push(h('div', {}, [
            h('p', { class: 'test' }, [`Hello ${i}`])
          ]))
        }

        return h('div', {}, children)
      }, { childCount: 1 }, { increment })

      const instance = mount(dom.window.document.body, h(Test))
      assert.strictEqual(dom.window.document.body.innerHTML, '<div><div><p class="test">Hello 1</p></div></div>')
      instance.actions.increment()
      assert.strictEqual(dom.window.document.body.innerHTML, '<div><div><p class="test">Hello 1</p></div><div><p class="test">Hello 2</p></div></div>')
    })

    it('should process innerHTML', () => {
      const dom = new JSDOM('<body></body>')

      const Test = view(
        h('div', {}, [
          h('div', { class: 'test', innerHtml: '<p>Hello world</p>' })
        ])
      )

      mount(dom.window.document.body, h(Test))
      assert.strictEqual(dom.window.document.body.innerHTML, '<div><div class="test"><p>Hello world</p></div></div>')
    })
  })
})
