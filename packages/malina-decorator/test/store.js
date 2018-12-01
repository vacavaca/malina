/* eslint-disable no-undef */
const assert = require('assert')
const { JSDOM } = require('jsdom')
const { h, view, mount } = require('malina')
const { withStore, connect, bindActions } = require('..')

const barier = () => {
  const result = {}
  result.lock = new Promise(resolve => {
    result.unlock = resolve
  })
  return result
}

describe('store', () => {
  describe('withStore', () => {
    it('should initialize view', () => {
      const dom = new JSDOM('<body></body>')

      // const Test = withStore({})(view((s, a, children) => children))
      // mount(dom.window.document.body, h(Test, {}, ['Hello']))

      // assert.strictEqual(dom.window.document.body.innerHTML, 'Hello')
    })
  })

  describe('connectStore', () => {
    it('should pass the store around', () => {
      const dom = new JSDOM('<body></body>')

      // const Bottom = connect(store => ({ store }))(view(({ store }) => `value: ${store.foo}`))
      // const Middle = view((s, a, children) => h('div', {}, [h(Bottom)]))
      // const Top = withStore({ foo: 42 })(view((s, a, children) => h(Middle)))

      // mount(dom.window.document.body, h(Top))

      // assert.strictEqual(dom.window.document.body.innerHTML, '<div>value: 42</div>')
    })

    it('should update store properly', async () => {
      const dom = new JSDOM('<body></body>')

      // let created = barier()
      // let updated = barier()

      // const actions = {}
      // actions.update = tempo => store =>
      //   ({
      //     foo: store.foo++
      //   })

      // const hooks = {}
      // hooks.create = (mount, { update }) => {
      //   created.unlock()
      //   update()
      //   updated.unlock()
      // }

      // const Bottom = view(({ store }) => `value: ${store.foo}`, {}, {}, hooks)
      // const ConnectedBottom = connect(store => ({ store }), bindActions(actions))(Bottom)

      // const Middle = view((s, a, children) => h('div', {}, [h(ConnectedBottom)]))
      // const Top = withStore({ foo: 42 })(view((s, a, children) => h(Middle)))

      // mount(dom.window.document.body, h(Top))

      // await created.lock

      // assert.strictEqual(dom.window.document.body.innerHTML, '<div>value: 42</div>')
    })
  })
})
