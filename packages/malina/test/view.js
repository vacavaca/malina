/* eslint-disable no-undef */
const assert = require('assert')
const { JSDOM } = require('jsdom')
const { asyncTest } = require('./util')
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

      const Test = view(null, state, actions)
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
})
