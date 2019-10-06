import { h, view, decorator, getContext, withContext, withTemplate, withActions } from 'malina';
import { shallowEqual, keys, compose, memoize } from 'malina-util';

const actions = {};

actions.finishUpdate = update => ({ state }) => {
  const next = { ...state.store, ...update };
  if (!shallowEqual(state.store, next))
    return { store: next };
};

actions.update = updater => async ({ state, actions }) => {
  let next = { ...state.store };
  let result = updater;
  if (updater instanceof Function)
    result = updater(next);

  if (result instanceof Promise)
    result = await result;

  if (result != null)
    await actions.finishUpdate(result);
};

const wrapUpdate = update => async (...args) => {
  const result = await update(...args);
  return result.store;
};

const key = Symbol.for('__malina_store');

const passToContext = compose(
  withContext(({ state, actions }) =>
    ({ [key]: { state: state.store, update: actions.update } }))
);

const StoreView = view(
  withTemplate(({ children }) => children),
  withActions(actions),
  passToContext
);

export const withStore = initial => decorator(Inner =>
  ({ state, children }) => h(StoreView, { store: initial }, h(Inner, state, children)));

const empty = (...a) => ({});

export const connect = (mapState = empty, mapUpdate = empty) =>
  getContext(ctx => {
    if (key in ctx) {
      const store = ctx[key];
      const normMapState = mapState != null ? mapState : empty;
      const normMapUpdate = mapUpdate != null ? mapUpdate : empty;
      return {
        ...(normMapState(store.state) || {}),
        ...(normMapUpdate(store.update) || {})
      };
    } else return {};
  });

export const bindActions = actions => memoize(update => {
  const wrappedUpdate = wrapUpdate(update);
  const bound = {};
  for (const key of keys(actions)) {
    const action = actions[key];
    if (action instanceof Function)
      bound[key] = (...args) => wrappedUpdate(action(...args));
    else bound[key] = bindActions(action)(update);
  }

  return bound;
});
