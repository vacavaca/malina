/* eslint-disable no-undef */
const assert = require('assert')
const { JSDOM } = require('jsdom')
const { h, view, mount } = require('malina')
const { withStore, connect, bindActions, withContext, withBehavior } = require('..')
const { asyncTest } = require('./util')

describe('store', () => {
  describe('withStore', () => {
    it('should initialize view', () => {
      const dom = new JSDOM('<body></body>')

      const Test = withStore({})(view(({ children }) => children))
      mount(dom.window.document.body, h(Test, {}, ['Hello']))

      assert.strictEqual(dom.window.document.body.innerHTML, 'Hello')
    })
  })

  describe('connectStore', () => {
    it('should pass the store around', () => {
      const dom = new JSDOM('<body></body>')

      const Bottom = view(({ state: { store } }) => `value: ${store.foo}`).decorate(connect(store => ({ store })))
      const Middle = view(h('div', {}, h(Bottom)))
      const Top = view(h(Middle)).decorate(withStore({ foo: 42 }))

      mount(dom.window.document.body, h(Top))

      assert.strictEqual(dom.window.document.body.innerHTML, '<div>value: 42</div>')
    })

    it('should update store properly', asyncTest(async track => {
      const dom = new JSDOM('<body></body>')

      const update = increment => store =>
        ({ foo: store.foo + increment })

      const Bottom = view(({ state: { store } }) => `value: ${store.foo}`).decorate(
        withBehavior(track(async view => {
          await view.mount()
          assert.strictEqual(dom.window.document.body.innerHTML, '<div>value: 42</div>')
          await view.state.update(3)
          assert.strictEqual(dom.window.document.body.innerHTML, '<div>value: 45</div>')
        }))
      )

      const ConnectedBottom = Bottom.decorate(connect(store => ({ store }), bindActions({ update })))
      const Middle = view(({ children }) => h('div', {}, [h(ConnectedBottom)]))
      const Top = view(({ children }) => h(Middle)).decorate(withStore({ foo: 42 }))

      mount(dom.window.document.body, h(Top))
    }))

    it('should not overwrite existing context', () => {
      const dom = new JSDOM('<body></body>')

      const Test = view(({ state }) => {
        assert.strictEqual(state.first, 1)
        assert.strictEqual(state.second, 2)
        return null
      }).decorate(
        withContext(state => ({ first: state.first })),
        withStore({ second: 2 }),
        connect(store => ({ second: store.second }))
      )

      mount(dom.window.document.body, h(Test, { first: 1 }))
    })

    it('should bind nested actions', () => {
      const dom = new JSDOM('<body></body>')

      const Test = view(({ state }) => {
        assert(typeof state.foo === 'object')
        assert(state.foo.first instanceof Function)
        assert(state.foo.second instanceof Function)
        return null
      }).decorate(
        withStore({ test: 42 }),
        connect(null, bindActions({
          foo: {
            first: () => () => { },
            second: () => () => { }
          }
        }))
      )

      mount(dom.window.document.body, h(Test))
    })

    //   it('should save store state after update', asyncTest(async (track) => {
    //     const dom = new JSDOM('<body></body>')
    //     let counter = 0

    //     let liftedStoreUpdate = null

    //     let hooks = {}

    //     hooks.update = track(async (_, state) => {
    //       console.log('iner', unsafeGetStore(state))
    //       if (state.counter == 1)
    //         liftedTopUpdate()
    //     })

    //     const Inner = view(state => {
    //       liftedStoreUpdate = state.update
    //     }, {}, {}, hooks).decorate(
    //       connect(null, bindActions({
    //         update: () => store => ({ foo: store.foo + 1 })
    //       }))
    //     )

    //     const state = {
    //       test: 1
    //     }

    //     const actions = {}

    //     actions.update = () => state => ({
    //       test: state.test + 1
    //     })

    //     hooks = {}

    //     hooks.update = track(async (_, state) => {
    //       const store = unsafeGetStore(state)
    //       // console.log(store)
    //     })

    //     let liftedTopUpdate = null
    //     let ctxRef = null

    //     const Test = view((state, actions) => {
    //       liftedTopUpdate = actions.update
    //       ctxRef = unsafeGetContext(state)
    //       return h(Inner, { counter: ++counter })
    //     }, state, actions, hooks).decorate(
    //       withStore({ foo: 1 })
    //     )

    //     mount(dom.window.document.body, h(Test))
    //     liftedStoreUpdate()
    //     // liftedTopUpdate()

    //     // console.log(ctxRef.value[Symbol.for("__malina_store")])
    //   }))
  })
})
