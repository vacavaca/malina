/* eslint-disable no-undef */
const assert = require('assert');
const { JSDOM } = require('jsdom');
const { h, view, template, mount, withTemplate, withState, withActions } = require('malina');
const { withUniqIds } = require('../index.js');

describe('id', () => {
  describe('withUniqIds', () => {
    it('should generate ids for markup', () => {
      const dom = new JSDOM('<body></body>');

      const Test = view(
        withTemplate(
          h('div', { id: 'test' }, [
            h('span', { id: 'other' }, ['AAA']),
            h('span', { id: 'test' }, ['AAA'])
          ])
        ),
        withUniqIds({ length: 4 }));

      mount(dom.window.document.body, h(Test));

      assert.strictEqual(
        dom.window.document.body.innerHTML,
        '<div id="test_0001"><span id="other_0002">AAA</span><span id="test_0001">AAA</span></div>'
      );
    });

    it('should not generate ids for not decorated inner views', () => {
      const dom = new JSDOM('<body></body>');

      const Inner = template(
        h('section', {}, [
          h('p', { id: 'test' }, ['Hello'])
        ])
      );

      const Test = view(
        withTemplate(() =>
          h('div', { id: 'test' }, [
            h('span', { id: 'other' }, ['AAA']),
            h(Inner)
          ])
        ),
        withUniqIds({ length: 4 }));

      mount(dom.window.document.body, h(Test));

      assert.strictEqual(
        dom.window.document.body.innerHTML,
        '<div id="test_0001"><span id="other_0002">AAA</span><section><p id="test">Hello</p></section></div>'
      );
    });

    it('should generate ids for decorated inner views', () => {
      const dom = new JSDOM('<body></body>');

      const Inner = view(
        withTemplate(
          h('section', {}, [
            h('p', { id: 'test' }, ['Hello']),
            h('p', { id: 'test_2' }, ['Hello'])
          ])
        ),
        withUniqIds({ length: 5 }));

      const Test = view(
        withTemplate(() =>
          h('div', { id: 'test' }, [
            h('span', { id: 'other' }, ['AAA']),
            h(Inner)
          ])
        ),
        withUniqIds({ length: 4 }));

      mount(dom.window.document.body, h(Test));

      assert.strictEqual(
        dom.window.document.body.innerHTML,
        '<div id="test_0001"><span id="other_0002">AAA</span><section><p id="test_00003">Hello</p><p id="test_2_00004">Hello</p></section></div>'
      );
    });

    it('should preserve ids between updates', () => {
      const dom = new JSDOM('<body></body>');

      const state = { counter: 0 };
      const update = () => ({ state }) => ({
        counter: state.counter + 1
      });

      const Test = view(
        withTemplate(
          ({ state }) =>
            h('div', { id: 'test', 'data-counter': state.counter }, [
              h('span', { id: 'other' }, ['AAA']),
              h('span', { id: 'test' }, ['AAA'])
            ])
        ),
        withState(state),
        withActions({ update }),
        withUniqIds({ length: 4 }));

      const instance = mount(dom.window.document.body, h(Test));

      assert.strictEqual(
        dom.window.document.body.innerHTML,
        '<div id="test_0001" data-counter="0"><span id="other_0002">AAA</span><span id="test_0001">AAA</span></div>'
      );

      instance.actions.update();

      assert.strictEqual(
        dom.window.document.body.innerHTML,
        '<div id="test_0001" data-counter="1"><span id="other_0002">AAA</span><span id="test_0001">AAA</span></div>'
      );
    });

    it('should generate different ids for same names in different views', () => {
      const dom = new JSDOM('<body></body>');

      const Test1 = view(
        withTemplate(
          h('div', {}, [
            h('span', { id: 'test' }),
            h('span', { id: 'test' })
          ])
        ),
        withUniqIds()
      );

      const Test2 = view(
        withTemplate(
          h('div', {}, [
            h('span', { id: 'test' }),
            h('span', { id: 'test' })
          ])
        ),
        withUniqIds()
      );

      const state = { counter: 0 };
      const update = () => ({ state }) => ({
        counter: state.counter + 1
      });

      const Test = view(
        withTemplate(
          ({ state }) =>
            h('div', {
              id: 'test',
              'data-counter': state.counter
            }, [
              h(Test1),
              h(Test2)
            ])
        ),
        withState(state),
        withActions({ update }),
        withUniqIds()
      );

      const instance = mount(dom.window.document.body, h(Test));

      assert.strictEqual(
        dom.window.document.body.innerHTML,
        '<div id="test_0001" data-counter="0"><div><span id="test_0002"></span><span id="test_0002"></span></div><div><span id="test_0003"></span><span id="test_0003"></span></div></div>'
      );

      instance.actions.update();

      assert.strictEqual(
        dom.window.document.body.innerHTML,
        '<div id="test_0001" data-counter="1"><div><span id="test_0002"></span><span id="test_0002"></span></div><div><span id="test_0003"></span><span id="test_0003"></span></div></div>'
      );
    });
  });
});
