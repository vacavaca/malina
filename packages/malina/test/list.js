/* eslint-disable no-undef */
const assert = require('assert');
const { JSDOM } = require('jsdom');
const { h, view, mount, withTemplate, withState, withActions, List } = require('..');

describe('util', () => {
  describe('List', () => {
    it('should render lists', () => {
      const dom = new JSDOM('<body></body>');

      const View = view(
        withTemplate(({ state: { data } }) =>
          h(List, { data, indexBy: 'id' }, item => h('div', { id: item.id }, item.text))
        ),
        withState({
          data: [
            { text: 'First', id: 1 },
            { text: 'Second', id: 2 },
            { text: 'Third', id: 3 }
          ]
        })
      );

      mount(dom.window.document.body, h(View));

      assert.strictEqual(dom.window.document.body.innerHTML, '<div id="1">First</div><div id="2">Second</div><div id="3">Third</div>');
    });

    it('should add items to the end of the list', () => {
      const dom = new JSDOM('<body></body>');

      const View = view(
        withTemplate(({ state: { data } }) =>
          h(List, { data, indexBy: 'id' }, item => h('div', { id: item.id }, item.text))
        ),
        withState({
          data: [
            { text: 'First', id: 1 },
            { text: 'Second', id: 2 },
            { text: 'Third', id: 3 }
          ]
        }),
        withActions({
          add: () => ({ state: { data } }) => ({
            data: [
              ...data,
              { text: 'Fourth', id: 4 },
              { text: 'Fith', id: 5 }
            ]
          })
        })
      );

      const instance = mount(dom.window.document.body, h(View));
      assert.strictEqual(dom.window.document.body.innerHTML, '<div id="1">First</div><div id="2">Second</div><div id="3">Third</div>');

      instance.actions.add();

      assert.strictEqual(dom.window.document.body.innerHTML, '<div id="1">First</div><div id="2">Second</div><div id="3">Third</div><div id="4">Fourth</div><div id="5">Fith</div>');
    });

    it('should add items to the begining of the list', () => {
      const dom = new JSDOM('<body></body>');

      const View = view(
        withTemplate(({ state: { data } }) =>
          h(List, { data, indexBy: 'id' }, item => h('div', { id: item.id }, item.text))
        ),
        withState({
          data: [
            { text: 'Fourth', id: 4 },
            { text: 'Fith', id: 5 }
          ]
        }),
        withActions({
          add: () => ({ state: { data } }) => ({
            data: [
              { text: 'First', id: 1 },
              { text: 'Second', id: 2 },
              { text: 'Third', id: 3 },
              ...data
            ]
          })
        })
      );

      const instance = mount(dom.window.document.body, h(View));
      assert.strictEqual(dom.window.document.body.innerHTML, '<div id="4">Fourth</div><div id="5">Fith</div>');

      instance.actions.add();

      assert.strictEqual(dom.window.document.body.innerHTML, '<div id="1">First</div><div id="2">Second</div><div id="3">Third</div><div id="4">Fourth</div><div id="5">Fith</div>');
    });

    it('should render reversed lists', () => {
      const dom = new JSDOM('<body></body>');

      const View = view(
        withTemplate(({ state: { data } }) =>
          h(List, { data, reverse: true, indexBy: 'id' }, item => h('div', { id: item.id }, item.text))
        ),
        withState({
          data: [
            { text: 'Third', id: 3 },
            { text: 'Second', id: 2 },
            { text: 'First', id: 1 }
          ]
        })
      );

      mount(dom.window.document.body, h(View));

      assert.strictEqual(dom.window.document.body.innerHTML, '<div id="1">First</div><div id="2">Second</div><div id="3">Third</div>');
    });

    it('should add items to the end of the reversed list', () => {
      const dom = new JSDOM('<body></body>');

      const View = view(
        withTemplate(({ state: { data } }) =>
          h(List, { data, reverse: true, indexBy: 'id' }, item => h('div', { id: item.id }, item.text))
        ),
        withState({
          data: [
            { text: 'Fith', id: 5 },
            { text: 'Fourth', id: 4 },
            { text: 'Third', id: 3 }
          ]
        }),
        withActions({
          add: () => ({ state: { data } }) => ({
            data: [
              ...data,
              { text: 'Second', id: 2 },
              { text: 'First', id: 1 }
            ]
          })
        })
      );

      const instance = mount(dom.window.document.body, h(View));
      assert.strictEqual(dom.window.document.body.innerHTML, '<div id="3">Third</div><div id="4">Fourth</div><div id="5">Fith</div>');

      instance.actions.add();

      assert.strictEqual(dom.window.document.body.innerHTML, '<div id="1">First</div><div id="2">Second</div><div id="3">Third</div><div id="4">Fourth</div><div id="5">Fith</div>');
    });

    it('should add items to the begining of the list', () => {
      const dom = new JSDOM('<body></body>');

      const View = view(
        withTemplate(({ state: { data } }) =>
          h(List, { data, reverse: true, indexBy: 'id' }, item => h('div', { id: item.id }, item.text))
        ),
        withState({
          data: [
            { text: 'Second', id: 2 },
            { text: 'First', id: 1 }
          ]
        }),
        withActions({
          add: () => ({ state: { data } }) => ({
            data: [
              { text: 'Fith', id: 5 },
              { text: 'Fourth', id: 4 },
              { text: 'Third', id: 3 },
              ...data
            ]
          })
        })
      );

      const instance = mount(dom.window.document.body, h(View));
      assert.strictEqual(dom.window.document.body.innerHTML, '<div id="1">First</div><div id="2">Second</div>');

      instance.actions.add();

      assert.strictEqual(dom.window.document.body.innerHTML, '<div id="1">First</div><div id="2">Second</div><div id="3">Third</div><div id="4">Fourth</div><div id="5">Fith</div>');
    });

    it('should add items to the end of the reversed list alternating order', () => {
      const dom = new JSDOM('<body></body>');

      const View = view(
        withTemplate(({ state: { data, reverse } }) =>
          h(List, { data, reverse, indexBy: 'id' }, item => h('div', { id: item.id }, item.text))
        ),
        withState({
          reverse: true,
          data: [
            { text: 'Fith', id: 5 },
            { text: 'Fourth', id: 4 },
            { text: 'Third', id: 3 }
          ]
        }),
        withActions({
          add: () => ({ state: { data } }) => ({
            reverse: false,
            data: [
              ...data,
              { text: 'Second', id: 2 },
              { text: 'First', id: 1 }
            ]
          })
        })
      );

      const instance = mount(dom.window.document.body, h(View));
      assert.strictEqual(dom.window.document.body.innerHTML, '<div id="3">Third</div><div id="4">Fourth</div><div id="5">Fith</div>');

      instance.actions.add();

      assert.strictEqual(dom.window.document.body.innerHTML, '<div id="5">Fith</div><div id="4">Fourth</div><div id="3">Third</div><div id="2">Second</div><div id="1">First</div>');
    });
  });
});
