/* eslint-disable no-undef */
const assert = require('assert')
const { JSDOM } = require('jsdom')
const { asyncTest, withState, withActions } = require('./util')
const { h, view, mount, attach, Debug } = require('..')

describe('view', () => {
  describe('update', () => {
    it('should add new children while updating', () => {
      const dom = new JSDOM('<body></body>')

      const increment = () => ({ state: { childCount } }) => ({
        childCount: childCount + 1
      })

      const Test = view(view => {
        const { childCount } = view.state

        const children = []
        for (let i = 1; i <= childCount; i++) {
          children.push(h('div', {}, [
            h('p', { class: 'test' }, [`Hello ${i}`])
          ]))
        }

        return h('div', {}, children)
      }).decorate(
        withState({ childCount: 1 }),
        withActions({ increment })
      )

      const instance = mount(dom.window.document.body, h(Test))
      assert.strictEqual(dom.window.document.body.innerHTML, '<div><div><p class="test">Hello 1</p></div></div>')
      instance.actions.increment(42)
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

    it('should handle all sorts of actions', asyncTest(async (_, done) => {
      const dom = new JSDOM('<body></body>')

      const effect = {}
      const state = {}

      const actions = {}

      actions.simpleEffect = () => {
        effect.simpleEffect = true
      }

      actions.asyncEffect = async () => {
        effect.asyncEffect = true
      }

      actions.simpleAction = () => state =>
        ({ simpleAction: true })

      actions.effectAction = () => {
        effect.effectAction = true
        return state =>
          ({ effectAction: true })
      }

      actions.simpleAsyncAction = () => async state =>
        ({ simpleAsyncAction: true })

      actions.asyncEffectAction = async () => {
        effect.asyncEffectAction = true
        return state =>
          ({ asyncEffectAction: true })
      }

      actions.effectAsyncAction = () => {
        effect.effectAsyncAction = true
        return async state =>
          ({ effectAsyncAction: true })
      }

      actions.bothAsyncAction = async () => {
        effect.bothAsyncAction = true
        return async state =>
          ({ bothAsyncAction: true })
      }

      const Test = view(null).decorate(withState(state), withActions(actions))
      const instance = mount(dom.window.document.body, h(Test))

      instance.actions.simpleEffect()
      assert(effect.simpleEffect)

      await instance.actions.asyncEffect()
      assert(effect.asyncEffect)

      instance.actions.simpleAction()
      assert(instance.state.simpleAction)

      instance.actions.effectAction()
      assert(effect.effectAction)
      assert(instance.state.effectAction)

      await instance.actions.simpleAsyncAction()
      assert(instance.state.simpleAsyncAction)

      await instance.actions.asyncEffectAction()
      assert(effect.asyncEffectAction)
      assert(instance.state.asyncEffectAction)

      await instance.actions.effectAsyncAction()
      assert(effect.effectAsyncAction)
      assert(instance.state.effectAsyncAction)

      await instance.actions.bothAsyncAction()
      assert(effect.bothAsyncAction)
      assert(instance.state.bothAsyncAction)

      done()
    }))
  })

  describe('attach', () => {
    it('should attach to the prerendered dom', () => {
      const dom = new JSDOM(`<body><div class="test"><span>Lorem ipsum</span></div></body>`)

      const Inner = view(({ state }) => h('span', {}, state.text))

      const behavior = view => {
        view.state = { text: 'Lorem ipsum' }
      }

      const actions = {
        update: () => ({ text: 'Updated' })
      }

      const View = view(({ state }) => h('div', { class: 'test' }, h(Inner, { text: state.text })), behavior, actions)
      const instance = attach(dom.window.document.body, h(View))

      instance.actions.update()

      assert.strictEqual(dom.window.document.body.innerHTML, '<div class="test"><span>Updated</span></div>')
    })
  })

  describe('Debug', () => {
    it('should log component lifecycle', () => {
      const dom = new JSDOM(`<body></body>`)

      const logs = []
      const logger = (...args) => logs.push(args)

      const Inner = view(({ state }) =>
        h('span', {}, [
          h(
            Debug,
            {
              logger,
              info: 'test-component',
              data: state.text
            }
          ),
          state.text
        ]))

      const behavior = view => {
        view.state = { text: 'Lorem ipsum' }
      }

      const actions = {
        update: () => ({ text: 'Updated' })
      }

      const View = view(({ state }) => h('div', { class: 'test' }, h(Inner, { text: state.text })), behavior, actions)
      const instance = mount(dom.window.document.body, h(View))

      const debugParent = dom.window.document.body.childNodes[0].childNodes[0]

      instance.actions.update()
      instance.destroy()

      const [createMsg, createData] = logs[0]
      const [mountMsg, mountData, mountElement] = logs[1]
      const [updateMsg, updateData, updateElement] = logs[2]
      const [unmountMsg, unmountData] = logs[3]
      const [destroyMsg] = logs[4]

      assert.strictEqual(createMsg, 'DEBUG: created "test-component"')
      assert.strictEqual(mountMsg, 'DEBUG: mounted "test-component"')
      assert.strictEqual(updateMsg, 'DEBUG: updated "test-component"')
      assert.strictEqual(unmountMsg, 'DEBUG: unmounted "test-component"')
      assert.strictEqual(destroyMsg, 'DEBUG: destroyed "test-component"')

      assert.deepStrictEqual(createData, { info: 'test-component', data: 'Lorem ipsum' })
      assert.deepStrictEqual(mountData, { info: 'test-component', data: 'Lorem ipsum' })
      assert.deepStrictEqual(updateData, { info: 'test-component', data: 'Updated' })
      assert.deepStrictEqual(unmountData, { info: 'test-component', data: 'Updated' })

      assert.deepStrictEqual(mountElement, { parent: debugParent, index: 0 })
      assert.deepStrictEqual(updateElement, { parent: debugParent, index: 0 })
    })
  })
})
