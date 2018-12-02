/* eslint-disable no-undef */
const assert = require('assert')
const { JSDOM } = require('jsdom')
const { h, view, mount } = require('malina')
const { withStore, connect, bindActions } = require('..')

const asyncTest = test => async () => {
  let queue = []
  let wake = null
  let lock = new Promise(resolve => { wake = resolve })

  test(fn => (...args) => {
    queue.push(fn(...args))
    if (wake != null)
      wake()
  })

  await lock
  wake = null

  while (queue.length > 0) {
    await Promise.all(queue)
    queue = []
  }
}

describe('store', () => {
  describe('withStore', () => {
    it('should initialize view', () => {
      const dom = new JSDOM('<body></body>')

      const Test = withStore({})(view((s, a, children) => children))
      mount(dom.window.document.body, h(Test, {}, ['Hello']))

      assert.strictEqual(dom.window.document.body.innerHTML, 'Hello')
    })
  })

  describe('connectStore', () => {
    it('should pass the store around', () => {
      const dom = new JSDOM('<body></body>')

      const Bottom = connect(store => ({ store }))(view(({ store }) => `value: ${store.foo}`))
      const Middle = view((s, a, children) => h('div', {}, [h(Bottom)]))
      const Top = withStore({ foo: 42 })(view((s, a, children) => h(Middle)))

      mount(dom.window.document.body, h(Top))

      assert.strictEqual(dom.window.document.body.innerHTML, '<div>value: 42</div>')
    })

    it('should update store properly', asyncTest(async track => {
      const dom = new JSDOM('<body></body>')

      const actions = {}
      actions.update = increment => store =>
        ({ foo: store.foo + increment })

      const hooks = {}
      hooks.mount = track(async (mount, { update }) => {
        assert.strictEqual(dom.window.document.body.innerHTML, '<div>value: 42</div>')
        await update(3)
        assert.strictEqual(dom.window.document.body.innerHTML, '<div>value: 45</div>')
      })

      const Bottom = view(({ store }) => `value: ${store.foo}`, {}, {}, hooks)
      const ConnectedBottom = connect(store => ({ store }), bindActions(actions))(Bottom)
      const Middle = view((s, a, children) => h('div', {}, [h(ConnectedBottom)]))
      const Top = withStore({ foo: 42 })(view((s, a, children) => h(Middle)))

      mount(dom.window.document.body, h(Top))
    }))
  })
})
