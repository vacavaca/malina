/* eslint-disable no-undef */
const assert = require('assert')
const { JSDOM } = require('jsdom')
const { h, view, mount, template, withTemplate, withState, withActions } = require('malina')
const { cssModules } = require('..')

describe('cssModules', () => {
  it('should add classes', () => {
    const dom = new JSDOM('<body></body>')

    const Test = view(
      withTemplate(h('div', { styleName: 'test' })),
      cssModules({ test: 'test-class' })
    )

    mount(dom.window.document.body, h(Test))

    assert.strictEqual(
      dom.window.document.body.innerHTML,
      '<div class="test-class"></div>'
    )
  })

  it('should add classes to template function', () => {
    const dom = new JSDOM('<body></body>')

    const Test = view(
      withTemplate(({ state }) => h('div', { styleName: state.style })),
      cssModules({
        test: 'test-class'
      })
    )

    mount(dom.window.document.body, h(Test, { style: 'test' }))

    assert.strictEqual(
      dom.window.document.body.innerHTML,
      '<div class="test-class"></div>'
    )
  })

  it('should add classes to inner elements', () => {
    const dom = new JSDOM('<body></body>')

    const Test = view(
      withTemplate(
        h('div', {}, [
          h('p', { styleName: 'test' }, 'Hello')
        ])
      ),
      cssModules({
        test: 'test-class'
      })
    )

    mount(dom.window.document.body, h(Test))

    assert.strictEqual(
      dom.window.document.body.innerHTML,
      '<div><p class="test-class">Hello</p></div>'
    )
  })

  it('should add classes to inner views', () => {
    const dom = new JSDOM('<body></body>')

    const styles = {
      test: 'test-class',
      test2: 'test2-class'
    }

    const Inner = view(
      withTemplate(() => h('p', { styleName: 'test' }, 'Hello')),
      cssModules()
    )

    const Test = view(
      withTemplate(
        h('div', {}, [
          h(Inner)
        ])
      ),
      cssModules(styles)
    )

    mount(dom.window.document.body, h(Test))

    assert.strictEqual(
      dom.window.document.body.innerHTML,
      '<div><p class="test-class">Hello</p></div>'
    )
  })

  it('should add classes to nested inner views', () => {
    const dom = new JSDOM('<body></body>')

    const styles = {
      test: 'test-class',
      test2: 'test2-class'
    }

    const Inner = view(
      withTemplate(
        function Inner() { return h('p', { styleName: 'test' }, 'Hello') }
      ),
      cssModules()
    )

    const Inner2 = view(
      withTemplate(
        function Inner2() { return h(Inner) }
      ),
      cssModules(styles)
    )

    const Inner3 = view(
      withTemplate(
        function Inner3() { return h('div', { styleName: 'test2' }, h(Inner2)) }
      ),
      cssModules()
    )

    const Test = view(
      withTemplate(
        function Test() {
          return h('section', {}, [
            h(Inner3)
          ])
        }
      ),
      cssModules({})
    )

    mount(dom.window.document.body, h(Test))

    assert.strictEqual(
      dom.window.document.body.innerHTML,
      '<section><div><p class="test-class">Hello</p></div></section>'
    )
  })

  it('should add classes to inner views after update', async () => {
    const dom = new JSDOM('<body></body>')

    const styles = {
      test: 'test-class',
      test2: 'test2-class'
    }

    const Inner = view(
      withTemplate(
        () => h('p', { styleName: 'test' }, 'Hello')
      ),
      cssModules(styles)
    )

    const Inner2 = template(h(Inner))

    const Inner3 = view(
      withTemplate(
        () => h('div', { styleName: 'test2' }, h(Inner2))
      ),
      cssModules(styles)
    )

    const state = {
      i: 0
    }

    const actions = {
      update: () => state => ({
        i: state.i + 1
      })
    }

    const Test = view(
      withTemplate(
        h('div', {}, [
          h(Inner3)
        ])
      ),
      withState(state),
      withActions(actions),
      cssModules({})
    )

    const instance = mount(dom.window.document.body, h(Test))

    await instance.actions.update()

    assert.strictEqual(
      dom.window.document.body.innerHTML,
      '<div><div class="test2-class"><p class="test-class">Hello</p></div></div>'
    )
  })

  it('should add classes to inner views passed children', () => {
    const dom = new JSDOM('<body></body>')

    const Inner = template(
      ({ children }) => h('div', {},
        children
      )
    )

    const Test = view(
      withTemplate(
        h('div', {}, [
          h(Inner, {}, [
            h('p', { styleName: 'test' }, 'Hello')
          ])
        ])
      ),
      cssModules({
        test: 'test-class'
      })
    )

    mount(dom.window.document.body, h(Test))

    assert.strictEqual(
      dom.window.document.body.innerHTML,
      '<div><div><p class="test-class">Hello</p></div></div>'
    )
  })

  it('should add classes to decorated inner views passed children', () => {
    const dom = new JSDOM('<body></body>')

    const Inner = view(
      withTemplate(
        ({ children }) => h('div', { styleName: 'abc' },
          children
        )
      ),
      cssModules({
        abc: 'abc-class'
      })
    )

    const Test = view(
      withTemplate(
        h('div', {}, [
          h(Inner, {}, [
            h('p', { styleName: 'test' }, 'Hello')
          ])
        ])
      ),
      cssModules({
        test: 'test-class'
      })
    )

    mount(dom.window.document.body, h(Test))

    assert.strictEqual(
      dom.window.document.body.innerHTML,
      '<div><div class="abc-class"><p class="test-class">Hello</p></div></div>'
    )
  })

  it('should overwrite outer classes', () => {
    const dom = new JSDOM('<body></body>')

    const Inner = view(
      withTemplate(
        h('p', { styleName: 'test' }, 'Hello')
      ),
      cssModules({
        test: 'inner'
      })
    )

    const Test = view(
      withTemplate(
        h(Inner)
      ),
      cssModules({
        test: 'outer'
      })
    )

    mount(dom.window.document.body, h(Test))

    assert.strictEqual(
      dom.window.document.body.innerHTML,
      '<p class="inner">Hello</p>'
    )
  })
})
