/* eslint-disable no-undef */
const assert = require('assert')
const { JSDOM } = require('jsdom')
const { h, view, mount } = require('malina')
const { withState, withActions, getContext, withContext } = require('..')

describe('context', () => {
  it('should pass context down the tree', () => {
    const dom = new JSDOM('<body></body>')

    const Inner = view(({ state }) => state.foo).decorate(getContext(ctx => ctx))
    const Outer = view(h('div', {}, h(Inner))).decorate(
      withState({ foo: 'bar' }),
      withContext(({ state }) => state)
    )

    mount(dom.window.document.body, h(Outer))

    assert.strictEqual(
      dom.window.document.body.innerHTML,
      '<div>bar</div>'
    )
  })

  it('should allow fallbacks', () => {
    const dom = new JSDOM('<body></body>')

    const Inner = view(({ state }) => state.foo).decorate(getContext(ctx => ctx))
    const Fallback = view(h(Inner)).decorate(
      getContext(ctx => ctx),
      withContext(({ state }) => {
        if (!('foo' in state)) return { foo: 'fallback' }
        else return {}
      })
    )
    const Outer = view(h('div', {}, h(Fallback))).decorate(
      withContext(({ state }) => state),
      withActions({
        update: () => ({ foo: 'update', marker: 42 })
      })
    )

    const instance = mount(dom.window.document.body, h(Outer))

    assert.strictEqual(
      dom.window.document.body.innerHTML,
      '<div>fallback</div>'
    )

    instance.actions.update()

    assert.strictEqual(
      dom.window.document.body.innerHTML,
      '<div>update</div>'
    )
  })
})
