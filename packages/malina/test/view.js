/* eslint-disable no-undef */
const assert = require('assert');
const { JSDOM } = require('jsdom');
const { asyncTest } = require('./util');
const { h, view, mount, hydrate, template, withTemplate, withBehavior, withState, withActions } = require('..');

describe('view', () => {
  describe('update', () => {
    it('should add new children while updating', () => {
      const dom = new JSDOM('<body></body>');

      const increment = () => ({ state: { childCount } }) => ({
        childCount: childCount + 1
      });

      const Test = view(
        withTemplate(view => {
          const { childCount } = view.state;

          const children = [];
          for (let i = 1; i <= childCount; i++) {
            children.push(h('div', {}, [
              h('p', { class: 'test' }, [`Hello ${i}`])
            ]));
          }

          return h('div', {
            style: {
              top: '5px'
            }

          }, children);
        }),
        withState({ childCount: 1 }),
        withActions({ increment })
      );

      const instance = mount(dom.window.document.body, h(Test));
      assert.strictEqual(dom.window.document.body.innerHTML, '<div style="top: 5px;"><div><p class="test">Hello 1</p></div></div>');
      instance.actions.increment(42);
      assert.strictEqual(dom.window.document.body.innerHTML, '<div style="top: 5px;"><div><p class="test">Hello 1</p></div><div><p class="test">Hello 2</p></div></div>');

      instance.destroy();
      assert.strictEqual(dom.window.document.body.childNodes.length, 0);
    });

    it('should process innerHTML', () => {
      const dom = new JSDOM('<body></body>');

      const Test = template(
        h('div', {}, [
          h('div', { class: 'test', innerHtml: '<p>Hello world</p>' })
        ])
      );

      const instance = mount(dom.window.document.body, h(Test));
      assert.strictEqual(dom.window.document.body.innerHTML, '<div><div class="test"><p>Hello world</p></div></div>');

      instance.destroy();
      assert.strictEqual(dom.window.document.body.childNodes.length, 0);
    });

    it('should handle all sorts of actions', asyncTest(async (_, done) => {
      const dom = new JSDOM('<body></body>');

      const effect = {};
      const state = {};

      const actions = {};

      actions.simpleEffect = () => {
        effect.simpleEffect = true;
      };

      actions.asyncEffect = async () => {
        effect.asyncEffect = true;
      };

      actions.simpleAction = () => state =>
        ({ simpleAction: true });

      actions.effectAction = () => {
        effect.effectAction = true;
        return state =>
          ({ effectAction: true });
      };

      actions.simpleAsyncAction = () => async state =>
        ({ simpleAsyncAction: true });

      actions.asyncEffectAction = async () => {
        effect.asyncEffectAction = true;
        return state =>
          ({ asyncEffectAction: true });
      };

      actions.effectAsyncAction = () => {
        effect.effectAsyncAction = true;
        return async state =>
          ({ effectAsyncAction: true });
      };

      actions.bothAsyncAction = async () => {
        effect.bothAsyncAction = true;
        return async state =>
          ({ bothAsyncAction: true });
      };

      const Test = view(withState(state), withActions(actions));
      const instance = mount(dom.window.document.body, h(Test));

      instance.actions.simpleEffect();
      assert(effect.simpleEffect);

      await instance.actions.asyncEffect();
      assert(effect.asyncEffect);

      instance.actions.simpleAction();
      assert(instance.state.simpleAction);

      instance.actions.effectAction();
      assert(effect.effectAction);
      assert(instance.state.effectAction);

      await instance.actions.simpleAsyncAction();
      assert(instance.state.simpleAsyncAction);

      await instance.actions.asyncEffectAction();
      assert(effect.asyncEffectAction);
      assert(instance.state.asyncEffectAction);

      await instance.actions.effectAsyncAction();
      assert(effect.effectAsyncAction);
      assert(instance.state.effectAsyncAction);

      await instance.actions.bothAsyncAction();
      assert(effect.bothAsyncAction);
      assert(instance.state.bothAsyncAction);

      done();
    }));

    it('should add and delete the same views', () => {
      const dom = new JSDOM('<body></body>');

      const deleteFirst = () => ({ state }) => ({
        items: state.items.slice(1)
      });

      const insertMiddle = () => ({ state }) => ({
        items: [...state.items.slice(0, 1), { id: 42, text: 'new' }, ...state.items.slice(1)]
      });

      const Item = template(({ state }) => h('div', { data: { index: state.index } }, state.text));

      const List = view(
        withTemplate(({ state }) => h('div', {}, state.items.map((item, index) => h(Item, { ...item, key: item.id, index })))),
        withState({
          items: [
            { id: 1, text: 'first' },
            { id: 2, text: 'second' },
            { id: 3, text: 'third' }
          ]
        }),
        withActions({
          deleteFirst,
          insertMiddle
        })
      );

      const instance = mount(dom.window.document.body, h(List));
      assert.strictEqual(dom.window.document.body.innerHTML, '<div><div data-index="0">first</div><div data-index="1">second</div><div data-index="2">third</div></div>');
      instance.actions.deleteFirst();
      assert.strictEqual(dom.window.document.body.innerHTML, '<div><div data-index="0">second</div><div data-index="1">third</div></div>');
      instance.actions.insertMiddle();
      assert.strictEqual(dom.window.document.body.innerHTML, '<div><div data-index="0">second</div><div data-index="1">new</div><div data-index="2">third</div></div>');

      instance.destroy();
      assert.strictEqual(dom.window.document.body.childNodes.length, 0);
    });
  });

  describe('hydrate', () => {
    it('should hydrate the prerendered dom', () => {
      const dom = new JSDOM(`<body><div class="test"><span>Lorem ipsum</span></div></body>`);

      const Inner = template(({ state }) => h('span', {}, state.text));

      const behavior = view => {
        view.state = { text: 'Lorem ipsum' };
      };

      const actions = {
        update: () => ({ text: 'Updated' })
      };

      const View = view(
        withTemplate(({ state }) => h('div', { class: 'test' }, h(Inner, { text: state.text }))),
        withBehavior(behavior),
        withActions(actions)
      );
      const instance = hydrate(dom.window.document.body, h(View));

      instance.actions.update();

      assert.strictEqual(dom.window.document.body.innerHTML, '<div class="test"><span>Updated</span></div>');

      instance.destroy();
      assert.strictEqual(dom.window.document.body.childNodes.length, 0);
    });

    it('should call inner views mount handles', () => {
      const dom = new JSDOM(`<body><div> </div></body>`);

      let called = 0;

      const Inner = view(
        withBehavior(view => {
          view.onMount(() => { called += 1; });
        })
      );

      const View = template(h('div', {}, h(Inner)));
      hydrate(dom.window.document.body, h(View));

      assert.strictEqual(called, 1);
    });

    it('should call inner views unmount handles', () => {
      const dom = new JSDOM(`<body></body>`);

      let unmount = 0;
      let destroy = 0;

      const Inner = view(
        withTemplate(h('div')),
        withBehavior(view => {
          view.onUnmount(() => { unmount += 1; });
          view.onDestroy(() => { destroy += 1; });
        })
      );

      const Inner2 = view(
        withTemplate(h(Inner)),
        withBehavior(view => {
          view.onUnmount(() => { unmount += 1; });
          view.onDestroy(() => { destroy += 1; });
        })
      );

      const exclude = () => () => ({ include: false });

      const View = view(
        withTemplate(({ state }) => state.include ? h('div', {}, h(Inner2)) : h('div')),
        withState({ include: true }),
        withActions({ exclude })
      );

      const instance = mount(dom.window.document.body, h(View));

      instance.actions.exclude();

      assert.strictEqual(unmount, 2);
      assert.strictEqual(destroy, 2);
    });

    it('should add event listeners', () => {
      const dom = new JSDOM(`<body><div style="top: 5px;">0</div></body>`);

      const Inner = template(({ state }) => state.counter);

      const behavior = view => {
        view.state = { ...view.state, counter: 0 };
      };

      const actions = {
        update: () => ({ state }) => ({ counter: state.counter + 1 })
      };

      const View = view(
        withTemplate(({ state, actions }) => h('div', { onClick: actions.update }, h(Inner, state))),
        withBehavior(behavior),
        withActions(actions)
      );
      hydrate(dom.window.document.body, h(View));

      assert.strictEqual(dom.window.document.body.innerHTML, '<div>0</div>');

      dom.window.document.body.childNodes[0].click();

      assert.strictEqual(dom.window.document.body.innerHTML, '<div>1</div>');
    });

    it('should attach to views', () => {
      const dom = new JSDOM(`<body></body>`);

      const View = template(
        h('div', {}, [
          null,
          h('span', {}, 'test')
        ])
      );

      mount(dom.window.document.body, h(View));
    });

    it('should hydrate data attributes', () => {
      const dom = new JSDOM(`<body><div></div></body>`);

      const View = template(h('div', { data: { test: 42 } }));

      hydrate(dom.window.document.body, h(View));

      assert.strictEqual(dom.window.document.body.childNodes[0].dataset.test, '42');
      assert.strictEqual(dom.window.document.body.childNodes[0].getAttribute('data-test'), '42');
      assert.strictEqual(dom.window.document.body.innerHTML, '<div data-test="42"></div>');
    });

    it('should hydrate data attributes overwriting', () => {
      const dom = new JSDOM(`<body><div data-test="43"></div></body>`);

      const View = template(h('div', { data: { test: 42 } }));

      hydrate(dom.window.document.body, h(View));

      assert.strictEqual(dom.window.document.body.childNodes[0].dataset.test, '42');
      assert.strictEqual(dom.window.document.body.childNodes[0].getAttribute('data-test'), '42');
      assert.strictEqual(dom.window.document.body.innerHTML, '<div data-test="42"></div>');
    });

    it('should replace root element with empty text node', () => {
      const dom = new JSDOM(`<body></body>`);

      const View = view(
        withTemplate(({ state: { empty } }) => (
          empty ? null : h('div')
        )),
        withState({ empty: false }),
        withActions({
          empty: () => ({ empty: true })
        })
      );

      const instance = mount(dom.window.document.body, h(View));

      assert.strictEqual(dom.window.document.body.innerHTML, '<div></div>');

      instance.actions.empty();

      assert.strictEqual(dom.window.document.body.innerHTML, '');
      assert.strictEqual(dom.window.document.body.childNodes[0].textContent, '');
    });
  });
});
