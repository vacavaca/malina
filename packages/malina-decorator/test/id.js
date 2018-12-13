/* eslint-disable no-undef */
const assert = require('assert')
const { JSDOM } = require('jsdom')
const { h, view, mount } = require('malina')
const { withUniqIds } = require('..')

describe('id', () => {
  describe('withUniqIds', () => {
    it('should generate ids for markup', () => {
      const dom = new JSDOM('<body></body>')

      const Test = view(
        h('div', { id: 'test' }, [
          h('span', { id: 'other' }, ['AAA']),
          h('span', { id: 'test' }, ['AAA'])
        ])
      ).decorate(withUniqIds(4))

      mount(dom.window.document.body, h(Test))

      assert.strictEqual(
        dom.window.document.body.innerHTML,
        '<div id="test_0001"><span id="other_0002">AAA</span><span id="test_0001">AAA</span></div>'
      )
    })

    it('should not generate ids for not decorated inner views', () => {
      const dom = new JSDOM('<body></body>')

      const Inner = view(
        h('section', {}, [
          h('p', { id: 'test' }, ['Hello'])
        ])
      )

      const Test = view(() =>
        h('div', { id: 'test' }, [
          h('span', { id: 'other' }, ['AAA']),
          h(Inner)
        ])
      ).decorate(withUniqIds(4))

      mount(dom.window.document.body, h(Test))

      assert.strictEqual(
        dom.window.document.body.innerHTML,
        '<div id="test_0001"><span id="other_0002">AAA</span><section><p id="test">Hello</p></section></div>'
      )
    })

    it('should generate ids for decorated inner views', () => {
      const dom = new JSDOM('<body></body>')

      const Inner = view(
        h('section', {}, [
          h('p', { id: 'test' }, ['Hello']),
          h('p', { id: 'test_2' }, ['Hello'])
        ])
      ).decorate(withUniqIds(5))

      const Test = view(() =>
        h('div', { id: 'test' }, [
          h('span', { id: 'other' }, ['AAA']),
          h(Inner)
        ])
      ).decorate(withUniqIds(4))

      mount(dom.window.document.body, h(Test))

      assert.strictEqual(
        dom.window.document.body.innerHTML,
        '<div id="test_0001"><span id="other_0002">AAA</span><section><p id="test_0001">Hello</p><p id="test_2_00003">Hello</p></section></div>'
      )
    })
  })
})
