'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var malinaDecorator = require('malina-decorator');
var malinaUtil = require('malina-util');
var malina = require('malina');
var pathToRegexp = _interopDefault(require('path-to-regexp'));

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

function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;

  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }

  return target;
}

function _objectWithoutProperties(source, excluded) {
  if (source == null) return {};

  var target = _objectWithoutPropertiesLoose(source, excluded);

  var key, i;

  if (Object.getOwnPropertySymbols) {
    var sourceSymbolKeys = Object.getOwnPropertySymbols(source);

    for (i = 0; i < sourceSymbolKeys.length; i++) {
      key = sourceSymbolKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
      target[key] = source[key];
    }
  }

  return target;
}

const getRouterControl = history => ({
  push(url, state) {
    history.push(url, state);
  },

  replace(url, state) {
    history.replace(url, state);
  },

  forward() {
    history.forward();
  },

  back() {
    history.back();
  }

});

const createRouter = history => ({
  history,
  control: getRouterControl(history)
});

const updateKey = Symbol('update');
const subscriptionKey = Symbol('subscription');
const enableRouting = malinaUtil.compose(malinaDecorator.withHooks({
  create: original => (mount, state, actions) => {
    original();
    const router = state.router;
    state[subscriptionKey] = router.history.listen(actions[updateKey]);
  },
  destroy: original => (mount, state, actions) => {
    if (subscriptionKey in state) state[subscriptionKey]();
    original();
  }
}), malinaDecorator.withActions({
  [updateKey]: location => () => ({
    location
  })
}));
const provideLocationState = malinaDecorator.mapState(state => _objectSpread({
  router: state.router.control,
  location: state.location || state.router.history.location
}, malinaUtil.omit(['history', 'router'], state)));
const provideRouterState = malinaDecorator.mapState(state => _objectSpread({
  router: state.router.control
}, malinaUtil.omit(['history', 'router'], state)));
const routerKey = Symbol('router');
const withRouterContext = malinaUtil.compose( // try to get router from context
malinaDecorator.getContext(ctx => routerKey in ctx ? {
  router: ctx[routerKey]
} : {}), // create router if missing in context
malinaDecorator.withContext(state => {
  if (state == null || !('history' in state) && !('router' in state)) throw new Error('History object must be provided to the top-level routing view');

  if ('history' in state && !('router' in state)) {
    const router = createRouter(state.history);
    return {
      [routerKey]: router
    };
  } else return {};
}));
const withRouter = malinaUtil.compose(withRouterContext, provideRouterState);
const connectRouter = malinaUtil.compose(enableRouting, withRouterContext, provideLocationState);

const pathCache = new Map();
const pathCacheLimit = 10000;

const getCacheKey = (path, options) => {
  const optionsKeys = Object.keys(options);
  if (!optionsKeys.every(key => {
    const option = options[key];
    return typeof option !== 'object' && typeof option !== 'function';
  })) return null;
  optionsKeys.sort();
  return `${path}${optionsKeys.map(k => `${k}:${options[k]}`).join(',')}`;
};

const compilePathRegexp = (path, options) => {
  const cacheKey = getCacheKey(path, options);
  if (pathCache.has(cacheKey)) return pathCache.get(cacheKey);else {
    const keys = [];
    const regexp = pathToRegexp(path, keys, options);
    const result = {
      regexp,
      keys
    };
    if (pathCache.size < pathCacheLimit) pathCache.set(cacheKey, result);
    return result;
  }
};

const matchUrl = (url, path, options = {}) => {
  const _compilePathRegexp = compilePathRegexp(path, options),
        regexp = _compilePathRegexp.regexp,
        keys = _compilePathRegexp.keys;

  const match = regexp.exec(url);
  if (!match) return null;
  const values = match.slice(1);
  const params = keys.reduce((a, key, index) => ((a[key.name] = values[index] || null) || true) && a, {});
  return params;
};

const match = (location, path, options = {}) => {
  let part = options.hash ? location.hash : location.pathname;
  if (options.hash && !part.startsWith('#')) part = `#${part}`;
  if (!options.hash && !part.startsWith('/')) part = `/${part}`;
  return matchUrl(part, path, options);
};
const routeKey = Symbol('route');
const RouteView = malina.view((state, _, children = []) => {
  const render = children[0];
  if (children.length > 1) throw new Error('You must provide only one child to the Route, it can be a render function or a jsx node');
  const params = match(state.location, state.path, _objectSpread({}, state.options, {
    hash: !!state.hash
  }));
  return render instanceof Function ? render(params) : render;
}, {
  [routeKey]: true
});
const Route = malinaUtil.compose(malinaDecorator.withState({
  [routeKey]: true
}), connectRouter)(RouteView);

const filterSwitchRoutes = (location, isRoot = false) => node => {
  const viewNode = malina.isViewNode(node);
  let isRoute = viewNode && node.tag.state != null;
  let routeInitialState = null;

  if (isRoute) {
    const declaredState = node.tag.state;
    routeInitialState = declaredState instanceof Function ? declaredState(node.attrs) : declaredState;
    isRoute = routeInitialState[routeKey];
  }

  if (isRoute) {
    const state = node.attrs;
    const children = node.children;
    const params = match(location, state.path, _objectSpread({}, state.options, {
      hash: !!state.hash
    }));
    if (params == null) return null;

    if (children.length > 1) {
      if (isRoot) throw new Error('You must provide ony one child to Route it can be a render function or a jsx node');

      if (Array.isArray(children)) {
        return malinaUtil.flatten(children.map(filterSwitchRoutes(location))).filter(node => node != null);
      } else return filterSwitchRoutes(location)(children);
    } else if (children.length === 1) {
      const render = children[0];
      const next = render instanceof Function ? render(params) : render;

      if (Array.isArray(next)) {
        return malinaUtil.flatten(next.map(filterSwitchRoutes(location))).filter(node => node != null);
      } else return filterSwitchRoutes(location)(next);
    } else return null;
  } else if (!malina.isTextNode(node)) {
    const children = malinaUtil.flatten(node.children.map(filterSwitchRoutes(location))).filter(node => node != null);
    return malina.h(node.tag, node.attrs, children);
  } else return node;
};

const Switch = connectRouter(malina.view((state, _, children) => {
  if (children.length === 0) return null;
  const filtered = children.map(filterSwitchRoutes(state.location, true)).filter(node => node != null);
  if (filtered.length === 0) return null;
  if (filtered.length > 1) throw new Error('Only one root node is allowed inside Switch');
  return filtered[0];
}));

const state = {
  to: null,
  target: null,
  replace: false,
  state: {}
};
const actions = {};

actions.handleClick = e => ({
  router,
  to,
  target,
  replace,
  state
}) => {
  if (to == null) return;
  const modified = !!(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey);

  if (!e.defaultPrevented && e.button === 0 && (!target || target === '_self') && !modified) {
    e.preventDefault();
    const method = replace ? router.replace : router.push;
    method(to, state);
  }
};

var link = withRouter(malina.view((_ref, actions, children) => {
  let to = _ref.to,
      rest = _objectWithoutProperties(_ref, ["to"]);

  return malina.h('a', _objectSpread({
    href: to,
    onClick: actions.handleClick
  }, malinaUtil.omit(['router', 'replace', 'state'], rest)), children);
}, state, actions));

exports.Switch = Switch;
exports.Route = Route;
exports.match = match;
exports.Link = link;
exports.withRouter = withRouter;
exports.connectRouter = connectRouter;
