/* eslint-disable no-undef */
const assert = require('assert')
const { JSDOM } = require('jsdom')
const { h, view, mount } = require('malina')
const { withTemplate, withState, withActions, getContext, withContext } = require('..')

describe('context', () => {
  it('should pass context down the tree', () => {
    const dom = new JSDOM('<body></body>')

    const Inner = view(withTemplate(({ state }) => state.foo), getContext(ctx => ctx))
    const Outer = view(
      withTemplate(h('div', {}, h(Inner))),
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

    const Inner = view(withTemplate(({ state }) => state.foo), getContext(ctx => ctx))
    const Fallback = view(
      withTemplate(h(Inner)),
      getContext(ctx => ctx),
      withContext(({ state }) => {
        if (!('foo' in state)) return { foo: 'fallback' }
        else return {}
      })
    )

    const Outer = view(
      withTemplate(h('div', {}, h(Fallback))),
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
