/* eslint-disable no-undef */
const assert = require('assert');
const { JSDOM } = require('jsdom');
const { h, view, template, mount, Id, withTemplate, withContext, withBehavior } = require('malina');
const { withStore, connect, bindActions } = require('..');
const { asyncTest } = require('./util');

describe('store', () => {
  describe('withStore', () => {
    it('should initialize view', () => {
      const dom = new JSDOM('<body></body>');

      const Test = withStore({})(Id);
      mount(dom.window.document.body, h(Test, {}, ['Hello']));

      assert.strictEqual(dom.window.document.body.innerHTML, 'Hello');
    });
  });

  describe('connectStore', () => {
    it('should pass the store around', () => {
      const dom = new JSDOM('<body></body>');

      const Bottom = view(
        withTemplate(({ state: { store } }) => `value: ${store.foo}`),
        connect(store => ({ store }))
      );
      const Middle = template(h('div', {}, h(Bottom)));
      const Top = view(withTemplate(h(Middle)), withStore({ foo: 42 }));

      mount(dom.window.document.body, h(Top));

      assert.strictEqual(dom.window.document.body.innerHTML, '<div>value: 42</div>');
    });

    it('should update store properly', asyncTest(async track => {
      const dom = new JSDOM('<body></body>');

      const update = increment => store =>
        ({ foo: store.foo + increment });

      const ConnectedBottom = view(
        withTemplate(({ state: { store } }) => `value: ${store.foo}`),
        withBehavior(track(async view => {
          await view.mount();
          assert.strictEqual(dom.window.document.body.innerHTML, '<div>value: 42</div>');
          await view.state.update(3);
          assert.strictEqual(dom.window.document.body.innerHTML, '<div>value: 45</div>');
        })),
        connect(store => ({ store }), bindActions({ update }))
      );

      const Middle = template(({ children }) => h('div', {}, [h(ConnectedBottom)]));
      const Top = view(withTemplate(({ children }) => h(Middle)), withStore({ foo: 42 }));

      mount(dom.window.document.body, h(Top));
    }));

    it('should not overwrite existing context', () => {
      const dom = new JSDOM('<body></body>');

      const Test = view(
        withTemplate(({ state }) => {
          assert.strictEqual(state.first, 1);
          assert.strictEqual(state.second, 2);
          return null;
        }),
        withContext(state => ({ first: state.first })),
        connect(store => ({ second: store.second })),
        withStore({ second: 2 })
      );

      mount(dom.window.document.body, h(Test, { first: 1 }));
    });

    it('should bind nested actions', () => {
      const dom = new JSDOM('<body></body>');

      const Test = view(
        withTemplate(({ state }) => {
          assert(typeof state.foo === 'object');
          assert(state.foo.first instanceof Function);
          assert(state.foo.second instanceof Function);
          return null;
        }),
        connect(null, bindActions({
          foo: {
            first: () => () => { },
            second: () => () => { }
          }
        })),
        withStore({ test: 42 })
      );

      mount(dom.window.document.body, h(Test));
    });

    //   it('should save store state after update', asyncTest(async (track) => {
    //     const dom = new JSDOM('<body></body>')
    //     let counter = 0

    //     let liftedStoreUpdate = null

    //     let hooks = {}

    //     hooks.update = track(async (_, state) => {
    //       console.log('iner', unsafeGetStore(state))
    //       if (state.counter == 1)
    //         liftedTopUpdate()
    //     })

    //     const Inner = view(state => {
    //       liftedStoreUpdate = state.update
    //     }, {}, {}, hooks).decorate(
    //       connect(null, bindActions({
    //         update: () => store => ({ foo: store.foo + 1 })
    //       }))
    //     )

    //     const state = {
    //       test: 1
    //     }

    //     const actions = {}

    //     actions.update = () => state => ({
    //       test: state.test + 1
    //     })

    //     hooks = {}

    //     hooks.update = track(async (_, state) => {
    //       const store = unsafeGetStore(state)
    //       // console.log(store)
    //     })

    //     let liftedTopUpdate = null
    //     let ctxRef = null

    //     const Test = view((state, actions) => {
    //       liftedTopUpdate = actions.update
    //       ctxRef = unsafeGetContext(state)
    //       return h(Inner, { counter: ++counter })
    //     }, state, actions, hooks).decorate(
    //       withStore({ foo: 1 })
    //     )

    //     mount(dom.window.document.body, h(Test))
    //     liftedStoreUpdate()
    //     // liftedTopUpdate()

    //     // console.log(ctxRef.value[Symbol.for("__malina_store")])
    //   }))
  });
});
