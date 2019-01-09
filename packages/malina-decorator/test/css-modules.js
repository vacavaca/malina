/* eslint-disable no-undef */
const assert = require('assert')
const { JSDOM } = require('jsdom')
const { h, view, mount } = require('malina')
const { cssModules } = require('..')

describe('cssModules', () => {
  it('should add classes', () => {
    const dom = new JSDOM('<body></body>')

    const Test = view(
      h('div', { styleName: 'test' })
    ).decorate(
      cssModules({
        test: 'test-class'
      })
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
      state => h('div', { styleName: state.style })
    ).decorate(
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
      h('div', {}, [
        h('p', { styleName: 'test' }, 'Hello')
      ])
    ).decorate(
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
      () => h('p', { styleName: 'test' }, 'Hello')
    ).decorate(cssModules())

    const Test = view(
      h('div', {}, [
        h(Inner)
      ])
    ).decorate(cssModules(styles))

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
      function Inner() { return h('p', { styleName: 'test' }, 'Hello') }
    ).decorate(cssModules())

    const Inner2 = view(
      function Inner2() { return h(Inner) }
    ).decorate(cssModules(styles))

    const Inner3 = view(
      function Inner3() { return h('div', { styleName: 'test2' }, h(Inner2)) }
    ).decorate(cssModules())

    const Test = view(
      function Test() {
        return h('section', {}, [
          h(Inner3)
        ])
      }
    ).decorate(cssModules({}))

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
      () => h('p', { styleName: 'test' }, 'Hello')
    ).decorate(cssModules(styles))

    const Inner2 = view(
      () => h(Inner)
    )

    const Inner3 = view(
      () => h('div', { styleName: 'test2' }, h(Inner2))
    ).decorate(cssModules(styles))

    const state = {
      i: 0
    }

    const actions = {
      update: () => state => ({
        i: state.i + 1
      })
    }

    const Test = view(
      h('div', {}, [
        h(Inner3)
      ]), state, actions
    ).decorate(cssModules({}))

    const instance = mount(dom.window.document.body, h(Test))

    await instance.actions.update()

    assert.strictEqual(
      dom.window.document.body.innerHTML,
      '<div><div class="test2-class"><p class="test-class">Hello</p></div></div>'
    )
  })

  it('should add classes to inner views passed children', () => {
    const dom = new JSDOM('<body></body>')

    const Inner = view(
      (s, a, children) => h('div', {},
        children
      )
    )

    const Test = view(
      h('div', {}, [
        h(Inner, {}, [
          h('p', { styleName: 'test' }, 'Hello')
        ])
      ])
    ).decorate(
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
      (s, a, children) => h('div', { styleName: 'abc' },
        children
      )
    ).decorate(cssModules({
      abc: 'abc-class'
    }))

    const Test = view(
      h('div', {}, [
        h(Inner, {}, [
          h('p', { styleName: 'test' }, 'Hello')
        ])
      ])
    ).decorate(
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
      h('p', { styleName: 'test' }, 'Hello')
    ).decorate(cssModules({
      test: 'inner'
    }))

    const Test = view(
      h(Inner)
    ).decorate(
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
