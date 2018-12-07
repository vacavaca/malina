'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var malina = require('malina');
var malinaUtil = require('malina-util');

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }

  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}

function _asyncToGenerator(fn) {
  return function () {
    var self = this,
        args = arguments;
    return new Promise(function (resolve, reject) {
      var gen = fn.apply(self, args);

      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }

      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }

      _next(undefined);
    });
  };
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};
    var ownKeys = Object.keys(source);

    if (typeof Object.getOwnPropertySymbols === 'function') {
      ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) {
        return Object.getOwnPropertyDescriptor(source, sym).enumerable;
      }));
    }

    ownKeys.forEach(function (key) {
      _defineProperty(target, key, source[key]);
    });
  }

  return target;
}

const createInitializer = value => state => {
  if (value instanceof Function) return value(state) || {};else return value || {};
};

const withState = state => malina.decorator(Inner => {
  const originalState = createInitializer(Inner.state);
  const decorateState = createInitializer(state);

  const next = passed => {
    const declared = originalState(passed);
    const decorate = decorateState(passed);
    return _objectSpread({}, declared, decorate);
  };

  return malina.view(Inner.template, next, Inner.actions, Inner.hooks);
});
const withActions = actions => malina.decorator(Inner => {
  const originalActions = createInitializer(Inner.actions);
  const decorateActions = createInitializer(actions);

  const next = state => _objectSpread({}, originalActions(state), decorateActions(state));

  return malina.view(Inner.template, Inner.state, next, Inner.hooks);
});
const withHooks = hooks => malina.decorator(Inner => {
  const originalHooks = createInitializer(Inner.hooks);
  const decorateHooks = createInitializer(hooks);

  const next = state => {
    const original = originalHooks(state);
    const decorate = decorateHooks(state);

    const result = _objectSpread({}, original);

    for (const key in decorate) {
      result[key] = (mount, state, actions) => {
        const originalHook = () => {
          if (original[key] != null) original[key](mount, state, actions);
        };

        decorate[key](originalHook)(mount, state, actions);
      };
    }

    return result;
  };

  return malina.view(Inner.template, Inner.state, Inner.actions, next);
});
const withTemplate = getTemplate => malina.decorator(Inner => malina.view(getTemplate(Inner.template), Inner.state, Inner.actions, Inner.hooks));
const mapState = mapper => malina.decorator(Inner => (state, actions, children) => malina.h(Inner, mapper(state), children));

class EventEmitter {
  constructor() {
    this.listenerCounter = 0;
    this.listeners = {};
  }

  subscribe(listener) {
    const id = ++this.listenerCounter;
    this.listeners[id] = listener;
    return () => delete this.listeners[id];
  }

  notify(...args) {
    for (const id in this.listeners) this.listeners[id](...args);
  }

}

const contextKey = Symbol('context');

class Context {
  constructor(value = {}) {
    this.value = value;
    this.emitter = new EventEmitter();
  }

  subscribe(listener) {
    return this.emitter.subscribe(listener);
  }

  update(value) {
    const next = _objectSpread({}, this.value, value);

    if (malinaUtil.shallowEqual(this.value, next)) return;
    this.value = next;
    this.emitter.notify(this.value);
  }

  get() {
    return this.value;
  }

}

const decoratedCache = new Map();
const decoratedCacheLimit = 10000;

const memoizeDecorated = wrapped => malina.decorator(Inner => {
  if (decoratedCache.has(Inner.template)) return decoratedCache.get(Inner.template);else {
    let decorated = wrapped(Inner);
    if (decoratedCache.size < decoratedCacheLimit) decoratedCache.set(Inner.template, decorated);
    return decorated;
  }
});

const provideContext = memoizeDecorated(withTemplate(original => (state, actions, children) => {
  const context = state[contextKey];
  const node = original(state, actions, children);
  if (context != null) return decorateTemplate(context)(node);else return node;
}));

const decorateTemplate = context => node => {
  if (!Array.isArray(node)) {
    if (malina.isViewNode(node)) {
      const attrs = _objectSpread({}, node.attrs != null ? node.attrs : {}, {
        [contextKey]: context
      });

      return malina.h(provideContext(node.tag), attrs, node.children.map(decorateTemplate(context)));
    } else if (malina.isElementNode(node)) return malina.h(node.tag, node.attrs, node.children.map(decorateTemplate(context)));else return node;
  } else return node.map(decorateTemplate(context));
};

const defaultContextProvider = state => state;

const withContext = (provider = defaultContextProvider) => {
  const normalizedProvider = (state, actions) => {
    const context = provider(state, actions);
    if (typeof context !== 'object') throw new Error("Context must be an object derived from view's state and actions");
    return context;
  };

  return malinaUtil.compose(withHooks({
    create: original => (mount, state, actions) => {
      original();

      if (!(contextKey in state)) {
        const context = new Context(normalizedProvider(state, actions));
        state[contextKey] = context;
      }
    },
    update: original => (mount, state, actions) => {
      original();
      const context = state[contextKey];
      context.update(normalizedProvider(state, actions));
    }
  }), provideContext);
};
const updateKey = Symbol('update');
const subscriptionKey = Symbol('subscription');

const defaultContextGetter = context => ({
  context
});

const getContext = (getter = defaultContextGetter) => malinaUtil.compose(withHooks({
  create: original => (mount, state, actions) => {
    let context = state[contextKey];
    if (context != null) Object.assign(state, getter(context.value));
    original(); // becaue previous hook could be 'withContext'

    if (context == null) context = state[contextKey];

    if (context != null) {
      state[subscriptionKey] = context.subscribe(actions[updateKey]);
      Object.assign(state, getter(context.value));
    }
  },
  destroy: original => (mount, state, actions) => {
    if (subscriptionKey in state) state[subscriptionKey]();
    original();
  }
}), withActions({
  [updateKey]: value => () => _objectSpread({}, getter(value))
}));

const actions = {};

actions.update = updater =>
/*#__PURE__*/
function () {
  var _ref = _asyncToGenerator(function* ({
    store
  }) {
    let next = _objectSpread({}, store);

    let result = updater;
    if (updater instanceof Function) result = updater(next);
    if (result instanceof Promise) result = yield result;
    if (result != null) next = _objectSpread({}, next, result);
    if (!malinaUtil.shallowEqual(store, next)) return {
      store: next
    };
  });

  return function (_x) {
    return _ref.apply(this, arguments);
  };
}();

const key = Symbol('store');
const passToContext = withContext((state, actions) => ({
  [key]: {
    state: state.store,
    update: actions.update
  }
}));

const getStoreView = initial => passToContext(malina.view((s, a, children) => children, {
  store: initial
}, actions));

const withStore = initial => malina.decorator(Inner => {
  const Store = getStoreView(initial);
  return withTemplate(original => (state, actions, children) => malina.h(Store, {
    store: initial
  }, original(state, actions, children)))(Inner);
});

const empty = (...a) => ({});

const connect = (mapState$$1 = empty, mapUpdate = empty) => getContext(ctx => {
  if (key in ctx) {
    const store = ctx[key];
    return _objectSpread({}, mapState$$1(store.state), mapUpdate(store.update));
  } else return {};
});
const bindActions = actions => update => {
  const bound = {};
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = malinaUtil.keys(actions)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      const key = _step.value;
      const action = actions[key];
      if (action instanceof Function) bound[key] = (...args) => update(action(...args));else bound[key] = bindActions(action);
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return != null) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return bound;
};

const decoratedCache$1 = new Map();
const decoratedCacheLimit$1 = 10000;

const memoizeDecorated$1 = wrapped => malina.decorator(Inner => {
  if (decoratedCache$1.has(Inner.template)) return decoratedCache$1.get(Inner.template);else {
    let decorated = wrapped(Inner);
    if (decoratedCache$1.size < decoratedCacheLimit$1) decoratedCache$1.set(Inner.template, decorated);
    return decorated;
  }
});

const setClasses = (styles, styleAttribute) => memoizeDecorated$1(withTemplate(original => (state, actions, children) => {
  const node = original(state, actions, children);
  return decorateTemplate$1(styles, styleAttribute)(node);
}));

const decorateTemplate$1 = (styles, styleAttribute) => node => {
  if (malina.isViewNode(node)) return malina.h(setClasses(styles)(node.tag), node.attrs, node.children.map(decorateTemplate$1(styles)));else if (malina.isElementNode(node)) {
    if (node.attrs != null && styleAttribute in node.attrs) {
      const names = (node.attrs[styleAttribute] || '').split(' ').filter(name => name.length > 0);
      const existing = (node.attrs.class || '').split(' ').filter(name => name.length > 0);
      const styleClasses = names.map(name => styles[name]).filter(cl => cl != null).concat(existing).join(' ');

      const attrs = _objectSpread({}, node.attrs);

      delete attrs[styleAttribute];
      if (styleClasses.length > 0) attrs.class = styleClasses;
      return malina.h(node.tag, attrs, node.children.map(decorateTemplate$1(styles)));
    } else return malina.h(node.tag, node.attrs, node.children.map(decorateTemplate$1(styles)));
  } else return node;
};

var cssModules = ((styles, styleAttribute = 'styleName') => malina.decorator(View => setClasses(styles, styleAttribute)(View)));

exports.cssModules = cssModules;
exports.withState = withState;
exports.withActions = withActions;
exports.withHooks = withHooks;
exports.withTemplate = withTemplate;
exports.mapState = mapState;
exports.withContext = withContext;
exports.getContext = getContext;
exports.withStore = withStore;
exports.connect = connect;
exports.bindActions = bindActions;
