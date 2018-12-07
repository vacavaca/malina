'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var malinaUtil = require('malina-util');
var diff = require('diff');

const base58 = '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
const genRandomId = length => {
  let result = '';

  for (let i = 0; i < length; i++) result += base58[Math.round(Math.random() * (base58.length - 1))];

  return result;
};

class Declaration {
  constructor(template, state, actions, hooks) {
    this.template = template;
    this.state = state;
    this.actions = actions;
    this.hooks = hooks;
    this.id = genRandomId(8);
  }

  static isViewDeclaration(obj) {
    return typeof obj === 'object' && obj !== null && obj.isViewDeclaration instanceof Function && obj.isViewDeclaration();
  }

  isViewDeclaration() {
    return true; // because instanceof can be inreliable on some build configurations
  }

}

const view = (template, state = null, actions = null, hooks = null) => new Declaration(template instanceof Function ? template : () => template, state, actions, hooks);
const ViewDeclaration = Declaration;

class Node {
  constructor(tag, attrs = {}, children = []) {
    if (tag == null) throw new Error('JSX tag empty ');
    this.tag = tag;
    this.attrs = attrs;
    this.children = children;
  }

  static isNode(obj) {
    return typeof obj === 'object' && obj !== null && obj.isNode instanceof Function && obj.isNode();
  }

  isNode() {
    return true; // because instanceof can be inreliable on some build configurations
  }

  toString() {
    const tagName = typeof this.tag === 'string' ? this.tag : 'View';
    return `${tagName} ${JSON.stringify(this.attrs || {})}${this.children.length > 0 ? `\n${this.children.map(c => {
      if (c == null) return "\t''";
      const str = c.toString();
      return str.split('\n').map(s => `\t${s}`).join('\n');
    }).join('\n')}` : ''}`;
  }

}
const isViewNode = node => Node.isNode(node) && ViewDeclaration.isViewDeclaration(node.tag);
const isElementNode = node => Node.isNode(node) && !ViewDeclaration.isViewDeclaration(node.tag);
const isTextNode = node => !(node instanceof Object) && typeof node !== 'object';
const h = (tag, attrs, ...children) => {
  const childrenArray = children.length === 1 && Array.isArray(children[0]) ? children[0] : children;
  return new Node(tag, attrs, childrenArray);
};

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

function _slicedToArray(arr, i) {
  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest();
}

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

function _iterableToArrayLimit(arr, i) {
  var _arr = [];
  var _n = true;
  var _d = false;
  var _e = undefined;

  try {
    for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }

  return _arr;
}

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance");
}

const toOnEventName = event => `on${event[0].toUpperCase()}${event.substr(1)}`;
const normalizeEventName = name => {
  const lower = name.toLowerCase();
  return lower.startsWith('on') ? lower.substr(2) : lower;
};

class RenderingContext {
  constructor({
    isSvg = false
  }) {
    this.isSvg = isSvg;
  }

}

const isParametrizedAction = value => Array.isArray(value) && value.length === 2 && value[0] instanceof Function;

const isSameParametrizedAction = (a, b) => isParametrizedAction(a) && isParametrizedAction(b) && a[0] === b[0] && a[1] === b[1];

let mountLock = false;
let mountHookQueue = [];

const defaultRenderingContext = () => new RenderingContext({});

const svgRenderingContext = () => new RenderingContext({
  isSvg: true
});

const isRoot = path => path.length === 0;

const isSameViewNode = (a, b) => a.tag.id === b.tag.id;

const requireKeysSet = children => {
  if (!children.every((node, i) => i === 0 || !isViewNode(node) || !isViewNode(children[i - 1]) || node.attrs.key || !isSameViewNode(node, children[i - 1]))) throw new Error("Every view node in an array must have a 'key' attribute");
  return children;
};

const requireUniqueKeys = children => {
  let index = {};
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = children[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      const node = _step.value;

      if (isViewNode(node) && node.attrs.key) {
        if (!(node.tag.id in index)) index[node.tag.id] = {};
        if (node.attrs.key in index[node.tag.id]) throw new Error("Every view node in an array must have an unique 'key' attribute");
      }
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

  return children;
};

const requireValidChildren = malinaUtil.compose(requireKeysSet, requireUniqueKeys);
class View {
  constructor(node, renderingContext) {
    const declaration = node.tag,
          state = node.attrs,
          children = node.children;
    const declaredState = declaration.state instanceof Function ? declaration.state(state) : declaration.state;
    const declaredActions = declaration.actions instanceof Function ? declaration.actions(state) : declaration.actions;
    const declaredHooks = declaration.hooks instanceof Function ? declaration.hooks(state) : declaration.hooks;
    this.template = declaration.template;
    this.state = _objectSpread({}, declaredState || {}, state || {});
    this.actions = this.bindActions(declaredActions || {});
    this.children = children;
    this.hooks = declaredHooks || {};
    this.renderingContext = renderingContext || defaultRenderingContext();
    this.templateLock = false;
    this.updateLock = false;
    this.element = null;
    this.node = null;
    this.innerViews = new Map();
    this.parametrizedEventListeners = new Map();
    this.scheduledActions = [];
    this.mounted = false;
    this.destroyed = false;
    this.trackedActionUpdate = false;
    this.callHook('create');
  }

  static instantiate(node, renderingContext = null) {
    if (!isViewNode(node)) throw new Error('View can only be instantiated from view-nodes');
    return new View(node, renderingContext);
  }

  mount(container, index) {
    const document = container.ownerDocument;
    if (this.destroyed) return;
    let top = false;

    if (!mountLock) {
      mountLock = true;
      top = true;
    }

    const next = this.renderTemplate();
    if (Array.isArray(next)) throw new Error('View can only have one root element');

    if (isElementNode(next)) {
      if (next.tag === 'svg') this.renderingContext = svgRenderingContext();
      const element = this.mountNodeElement(container, index, next, []);
      this.element = element;
    } else if (isViewNode(next)) {
      const view$$1 = this.instantiateInnerView(next, []);
      view$$1.mount(container, index);
      this.element = view$$1.element;
    } else if (isTextNode(next)) {
      const element = document.createTextNode(`${next != null ? next : ''}`);
      this.element = element;
      const before = container.childNodes[index] || null;
      container.insertBefore(element, before);
    } else throw new Error('Invalid template type');

    this.node = next;
    this.mounted = true;
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = this.scheduledActions[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        const _step2$value = _slicedToArray(_step2.value, 2),
              action = _step2$value[0],
              args = _step2$value[1];

        this.callAction(action, ...args);
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
          _iterator2.return();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }

    this.scheduledActions = [];

    if (top) {
      const queue = mountHookQueue;
      mountHookQueue = [];

      for (var _i = 0; _i < queue.length; _i++) {
        const hook = queue[_i];
        hook();
      }

      this.callHook('mount');
      mountLock = false;
    } else mountHookQueue.push(() => this.callHook('mount'));
  }

  move(container, index) {
    const before = container.childNodes[index] || null;
    container.insertBefore(this.element, before);
    this.container = container;
    this.index = index;
  }

  update(state = null, children = null) {
    if (this.destroyed) throw new Error('View has been destroyed');
    const nextState = this.updateState(state);
    const nextChildren = this.updateChildrenState(children);
    const update = this.state !== nextState || this.children !== nextChildren;
    this.state = nextState;
    this.children = nextChildren;

    if (this.mounted && update) {
      this.refresh();
      this.callHook('update');
    }

    return update;
  }

  refresh() {
    const next = this.renderTemplate();
    const prev = this.node;
    this.node = next;
    this.patch(this.element, prev, next, []);
  }

  unmount(removeElement) {
    this.mounted = false;
    if (isElementNode(this.node)) this.destroyInnerViews(this.node, []);else if (isViewNode(this.node)) this.destroyInnerView([]);
    if (removeElement) this.element.remove();
    this.callHook('unmount');
    this.element = null;
  }

  destroy(removeElement = true) {
    this.unmount(removeElement);
    this.callHook('destroy');
    this.destroyed = true;
  }
  /** @private */


  static getPathKey(path) {
    return path.join('.');
  }
  /** @private */


  static getAttrKey(path, name) {
    return `${name}.${View.getPathKey(path)}`;
  }
  /** @private */


  renderTemplate() {
    this.templateLock = true;

    try {
      let next = this.template(this.state, this.actions, this.children);

      if (Array.isArray(next)) {
        if (next.length !== 1) throw new Error('Only one root element must be rendered for a view');
        next = next[0];
      }

      next = next != null ? next : '';
      return next;
    } finally {
      this.templateLock = false;
    }
  }
  /** @private */


  bindActions(actions) {
    const bound = {};
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
      for (var _iterator3 = malinaUtil.keys(actions)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
        const key = _step3.value;
        const action = actions[key];
        if (action instanceof Function) bound[key] = (...args) => this.callAction(actions[key], ...args);else bound[key] = this.bindActions(action);
      }
    } catch (err) {
      _didIteratorError3 = true;
      _iteratorError3 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion3 && _iterator3.return != null) {
          _iterator3.return();
        }
      } finally {
        if (_didIteratorError3) {
          throw _iteratorError3;
        }
      }
    }

    return bound;
  }
  /** @private */


  callAction(action, ...args) {
    var _this = this;

    if (this.templateLock) throw new Error("Actions can't be called while rendering view template");

    if (this.mounted) {
      const update = !this.updateLock;
      this.updateLock = true;
      const result = action(...args)(this.state, this.actions);

      if (result instanceof Promise) {
        this.updateLock = false;
        if (this.trackedActionUpdate) this.refresh();
        this.trackedActionUpdate = false;
        return _asyncToGenerator(function* () {
          const state = yield result;
          if (!_this.destroyed) _this.update(state);
          return _this.state;
        })();
      } else {
        if (update) {
          if (!this.destroyed && this.mounted) {
            const updated = this.update(result);
            if (!updated && this.trackedActionUpdate) this.refresh();
            this.trackedActionUpdate = false;
          } else if (!this.destroyed) this.state = this.updateState(result);
        } else {
          const nextState = this.updateState(result);
          this.trackedActionUpdate = this.trackedActionUpdate || this.state !== nextState;
          this.state = nextState;
        }

        this.updateLock = false;
        return this.state;
      }
    } else this.scheduledActions.push([action, args]);
  }
  /** @private */


  updateState(update = null) {
    if (update == null || update === this.state) return this.state;
    const nextState = update !== null ? _objectSpread({}, this.state, update) : this.state;
    return !malinaUtil.shallowEqual(this.state, nextState) ? nextState : this.state;
  }
  /** @private */


  updateChildrenState(children = null) {
    if (children === null || children === null) return this.children;
    const selfEmpty = this.children == null || this.children.length === 0;
    const nextEmpty = children.length === 0;
    if (selfEmpty !== nextEmpty) return children;else return !malinaUtil.shallowEqual(this.children, children) ? children : this.children;
  }
  /** @private */


  callHook(hook) {
    if (hook in this.hooks) this.hooks[hook](this.element, this.state, this.actions);
  }
  /** @private */


  patch(element, prev, next, path) {
    if (prev === next) return;

    if (isElementNode(prev)) {
      if (next == null) this.patchFromNodeToNone(element, prev, path);else if (isElementNode(next)) this.patchFromNodeToNode(element, prev, next, path);else if (isViewNode(next)) this.patchFromNodeToView(element, prev, next, path);else if (isTextNode(next)) this.patchFromNodeToText(element, prev, next, path);else throw new Error('Invalid template type');
    } else if (isViewNode(prev)) {
      if (next == null) this.patchFromViewToNone(element, prev, path);else if (isElementNode(next)) this.patchFromViewToNode(element, prev, next, path);else if (isViewNode(next)) this.patchFromViewToView(element, prev, next, path);else if (isTextNode(next)) this.patchFromViewToText(element, prev, next, path);else throw new Error('Invalid template type');
    } else {
      if (next == null) this.patchFromTextToNone(element, path);else if (isElementNode(next)) this.patchFromTextToNode(element, next, path);else if (isViewNode(next)) this.patchFromTextToView(element, next, path);else if (isTextNode(next)) this.patchTextNodes(element, prev, next, path);else throw new Error('Invalid template type');
    }
  }
  /** @private */


  patchFromTextToNone(element, path) {
    if (isRoot(path)) throw new Error('Root element deleted during patch');
    element.parentNode.removeChild(element);
  }
  /** @private */


  patchTextNodes(element, prev, next, path) {
    if (prev !== next) {
      const newElement = element.ownerDocument.createTextNode(`${next}`);
      element.replaceWith(newElement);
      if (isRoot(path)) this.element = newElement;
    }
  }
  /** @private */


  patchFromTextToNode(element, next, path) {
    const newElement = this.createNodeElement(element.ownerDocument, next, path);
    element.replaceWith(newElement);
    if (isRoot(path)) this.element = newElement;
  }
  /** @private */


  patchFromTextToView(element, next, path) {
    const view$$1 = this.instantiateInnerView(next, path);
    const index = Array.from(element.parentNode.childNodes).findIndex(n => n === element);
    const parent = element.parentNode;
    element.remove();
    view$$1.mount(parent, index);
    if (isRoot(path)) this.element = view$$1.element;
  }
  /** @private */


  patchFromNodeToNone(element, prev, path) {
    if (isRoot(path)) throw new Error('Root element deleted during patch');
    this.removeParametrizedListeners(prev, path);
    this.destroyInnerViews(prev, path);
    element.remove();
  }
  /** @private */


  patchFromNodeToText(element, prev, next, path) {
    this.removeParametrizedListeners(prev, path);
    this.destroyInnerViews(prev, path);
    const newElement = element.ownerDocument.createTextNode(`${next}`);
    element.replaceWith(newElement);
    if (isRoot(path)) this.element = newElement;
  }
  /** @private */


  patchFromNodeToNode(element, prev, next, path) {
    if (prev === next) return;

    if (prev.tag === next.tag) {
      this.updateAttributes(element, prev, next, path);
      this.updateChildren(element, prev, next, path);
    } else {
      this.removeParametrizedListeners(prev, path);
      this.destroyInnerViews(prev, path);
      const newElement = this.createNodeElement(element.ownerDocument, next, path);
      element.replaceWith(newElement);
      if (isRoot(path)) this.element = newElement;
    }
  }
  /** @private */


  patchFromNodeToView(element, prev, next, path) {
    this.removeParametrizedListeners(prev, path);
    this.destroyInnerViews(prev, path);
    const view$$1 = this.instantiateInnerView(next, path);
    const index = Array.from(element.parentNode.childNodes).findIndex(n => n === element);
    const parent = element.parentNode;
    element.remove();
    view$$1.mount(parent, index);
    if (isRoot(path)) this.element = view$$1.element;
  }
  /** @private */


  patchFromViewToNone(element, prev, path) {
    if (isRoot(path)) throw new Error('Root element deleted during patch');
    this.destroyInnerView(path);
    element.remove();
  }
  /** @private */


  patchFromViewToText(element, prev, next, path) {
    this.destroyInnerView(path);
    const newElement = element.ownerDocument.createTextNode(`${next}`);
    element.replaceWith(newElement);
    if (isRoot(path)) this.element = newElement;
  }
  /** @private */


  patchFromViewToNode(element, prev, next, path) {
    this.destroyInnerView(path);
    const newElement = this.createNodeElement(element.ownerDocument, next, path);
    element.replaceWith(newElement);
    if (isRoot(path)) this.element = newElement;
  }
  /** @private */


  patchFromViewToView(element, prev, next, path) {
    if (prev === next) return;

    if (isSameViewNode(prev, next) && prev.attrs.key === next.attrs.key) {
      const view$$1 = this.getInstantiatedView(path);
      view$$1.update(next.attrs, next.children);
    } else {
      this.destroyInnerView(path);
      const view$$1 = this.instantiateInnerView(next, path);
      const index = Array.from(element.parentNode.childNodes).findIndex(n => n === element);
      const parent = element.parentNode;
      element.remove();
      view$$1.mount(parent, index);
      if (isRoot(path)) this.element = view$$1.element;
    }
  }
  /** @private */


  unmountPatch() {
    this.mounted = false;
    this.callHook('unmount');
    this.element = null;
  }
  /** @private */


  destroyInnerViews(node, path) {
    for (const ndx in node.children) {
      const nextPath = path.concat([ndx]);
      const child = node.children[ndx];
      if (isViewNode(child)) this.destroyInnerView(nextPath);else if (isElementNode(child)) this.destroyInnerViews(child, nextPath);
    }
  }
  /** @private */


  destroyInnerView(path) {
    const view$$1 = this.getInstantiatedView(path);
    view$$1.destroy(false);
    this.removeInstantiatedView(path);
  }
  /** @private */


  createNodeElement(document, node, path) {
    let element;
    if (this.renderingContext.isSvg) element = document.createElementNS('http://www.w3.org/2000/svg', node.tag);else element = document.createElement(node.tag);
    this.refreshAttributes(element, node, path);
    this.refreshChildren(element, node, path);
    return element;
  }
  /** @private */


  mountNodeElement(container, index, node, path) {
    const document = container.ownerDocument;
    let element;
    if (this.renderingContext.isSvg) element = document.createElementNS('http://www.w3.org/2000/svg', node.tag);else element = document.createElement(node.tag);
    this.refreshAttributes(element, node, path);
    const before = container.childNodes[index] || null;
    container.insertBefore(element, before);
    this.refreshChildren(element, node, path, true);
    return element;
  }
  /** @private */


  refreshAttributes(element, node, path) {
    for (const name in node.attrs) {
      const value = node.attrs[name];
      this.addAttribute(element, name, value, path);
    }
  }
  /** @private */


  updateAttributes(element, prev, next, path) {
    if (prev === next) return;

    for (const name in next.attrs) {
      const nextValue = next.attrs[name];

      if (name in prev.attrs) {
        const prevValue = prev.attrs[name];
        this.updateAttribute(element, name, prevValue, nextValue, path);
      } else this.addAttribute(element, name, nextValue, path);
    }

    for (const name in prev.attrs) {
      if (!(name in next.attrs)) this.removeAttribute(element, name, prev.attrs[name], path);
    }
  }
  /** @private */


  addAttribute(element, name, value, path) {
    if (name === 'style') {
      for (const prop in value) this.setStyleProp(element, prop, value[prop] || '');
    } else if (value instanceof Function) this.addEventListener(element, normalizeEventName(name), value);else if (isParametrizedAction(value)) {
      const listener = this.createParametrizedListener(value[0], value[1], path, name);
      const event = normalizeEventName(name);
      this.addEventListener(element, event, listener);
    } else if (name === 'data' && value != null && typeof value === 'object') {
      for (const key in value) element.dataset[key] = value[key];
    } else if (name !== 'focus' && name in element && !this.renderingContext.isSvg && value != null) element[name] = value;else if (typeof value === 'boolean') {
      if (name === 'focus' && element.focus && element.blur) {
        if (value) element.focus();else element.blur();
      } else element.setattribute(name, name);
    } else if (value != null) element.setAttribute(name, value);
  }
  /** @private */


  updateAttribute(element, name, prev, next, path) {
    if (prev === next) return;
    if (isSameParametrizedAction(prev, next)) return;

    if (name === 'style') {
      for (const prop in prev) {
        if (!(prop in next)) this.removeStyleProp(element, prop);
      }

      for (const prop in next) {
        const style = next[prop] || '';
        this.setStyleProp(element, prop, style);
      }
    } else if (next instanceof Function) {
      this.removeAttribute(element, name, prev, path);
      this.addAttribute(element, name, next, path);
    } else if (isParametrizedAction(next)) {
      this.removeAttribute(element, name, prev, path);
      this.addAttribute(element, name, next, path);
    } else if (name === 'data') {
      const prevObject = prev != null && typeof prev === 'object';
      const nextObject = next != null && typeof next === 'object';

      if (prevObject && nextObject) {
        for (const key in prev) {
          if (!(key in next)) delete element.dataset[key];
        }

        for (const key in next) element.dataset[key] = next[key];
      } else if (prevObject && !nextObject) {
        for (const key in element.dataset) delete element.dataset[key];
      } else if (!prevObject && nextObject) {
        for (const key in next) element.dataset[key] = next[key];
      }
    } else if (name !== 'focus' && name in element && !this.renderingContext.isSvg) element[name] = next;else if (typeof prev === 'boolean') {
      if (name === 'focus') {
        if (element.focus && element.blur) {
          if (next) element.focus();else element.blur();
        }
      } else {
        if (next) element.setAttribute(name, name);else element.removeAttribute(name);
      }
    } else {
      if (next != null) element.setAttribute(name, next);else if (prev != null) element.removeAttribute(name);
    }
  }
  /** @private */


  removeAttribute(element, name, prev, path) {
    if (name === 'style') element.style.cssText = '';else if (prev instanceof Function) {
      const event = normalizeEventName(name);
      this.removeEventListener(element, event, prev);
    } else if (isParametrizedAction(prev)) {
      const listener = this.getParametrizedListener(path, name);
      const event = normalizeEventName(name);
      this.removeEventListener(element, event, listener);
    } else if (name === 'data' && prev != null && typeof prev === 'object') {
      for (const key in element.dataset) delete element.dataset[key];
    } else if (name !== 'focus' && name in element && !this.renderingContext.isSvg) element[name] = undefined;else if (typeof prev === 'boolean') {
      if (name === 'focus' && element.blur) element.blur();else element.removeAttribute(name);
    } else if (prev != null) element.removeAttribute(name);
  }
  /** @private */


  setStyleProp(element, prop, style) {
    if (prop[0] === '-') {
      const importantNdx = style.indexOf('!important');
      let clearedStyle = style;
      if (importantNdx !== -1) clearedStyle = importantNdx !== style.slice(0, importantNdx) + style.slice(importantNdx + 10);
      clearedStyle = clearedStyle.trim().replace(/;$/, '');
      element.style.setProperty(prop, clearedStyle);
    } else element.style[prop] = style;
  }
  /** @private */


  removeStyleProp(element, prop) {
    if (prop[0] === '-') element.style.removeProperty(prop);else delete element.style[prop];
  }
  /** @private */


  addEventListener(element, event, listener) {
    if (element.addEventListener) element.addEventListener(event, listener);else if (element.attachEvent) element.attachEvent(toOnEventName(event), listener);else {
      const listeners = element[event] && element[event].listeners || [];
      if (element[event] != null) element[event].listeners = listeners.concat(listener);else {
        const handler = (...args) => element[event].listeners.map(f => f(...args));

        handler.listeners = listeners.concat(listener);
        element[event] = handler;
      }
    }
  }
  /** @private */


  removeEventListener(element, event, listener) {
    if (element.removeEventListener) element.removeEventListener(event, listener);else if (element.detachEvent) element.detachEvent(toOnEventName(event), listener);else {
      if (element[event] != null && element[event].listeners != null) element[event].listeners = element[event].listener.filter(l => l !== listener);
    }
  }
  /** @private */


  refreshChildren(element, node, path, mount = false) {
    if (!requireValidChildren(node.children)) throw new Error("Every view node in an array must have an unique 'key' attribute");

    for (const ndx in node.children) {
      const child = node.children[ndx];
      const nextPath = path.concat([ndx]);
      this.addChildren(element, child, ndx, nextPath, mount);
    }
  }
  /** @private */


  addChildren(element, child, ndx = null, path, mount = false) {
    if (isElementNode(child)) {
      if (mount) this.mountNodeElement(element, null, child, path);else {
        const childElement = this.createNodeElement(element.ownerDocument, child, path);
        element.appendChild(childElement);
      }
    } else if (isViewNode(child)) {
      const view$$1 = this.instantiateInnerView(child, path);
      view$$1.mount(element, ndx);
    } else if (child != null) {
      const childElement = element.ownerDocument.createTextNode(`${child}`);
      element.appendChild(childElement);
    }
  }
  /** @private */


  updateChildren(element, prev, next, path) {
    if (prev === next) return;
    if (!requireValidChildren(next.children)) throw new Error("Every view node in an array must have an unique 'key' attribute");
    const len = Math.max(prev.children.length, next.children.length);
    let nodeIndexShift = 0;

    for (let ndx = 0; ndx < len; ndx++) {
      const childNode = element.childNodes[ndx - nodeIndexShift];
      const prevChild = prev.children[ndx];
      const nextChild = ndx in next.children ? next.children[ndx] : null;
      const nextPath = path.concat([ndx]);

      if (prevChild != null) {
        this.patch(childNode, prevChild, nextChild, nextPath);
        if (nextChild == null) nodeIndexShift += 1;
      } else {
        this.addChildren(element, nextChild, ndx, nextPath);
        nodeIndexShift -= 1;
      }
    }
  }
  /** @private */


  instantiateInnerView(node, path) {
    const key = View.getPathKey(path);
    const view$$1 = View.instantiate(node, this.renderingContext);
    this.innerViews.set(key, {
      view: view$$1,
      path: path.slice()
    });
    return view$$1;
  }
  /** @private */


  getInstantiatedView(path) {
    const key = View.getPathKey(path);
    const entry = this.innerViews.get(key);
    return entry != null ? entry.view : null;
  }
  /** @private */


  removeInstantiatedView(path) {
    const key = View.getPathKey(path);
    this.innerViews.delete(key);
  }
  /** @private */


  getParametrizedListener(path, name) {
    const key = View.getAttrKey(path, name);
    return this.parametrizedEventListeners.get(key);
  }
  /** @private */


  hasParametrizedListener(path, name) {
    const key = View.getAttrKey(path, name);
    return this.parametrizedEventListeners.has(key);
  }
  /** @private */


  createParametrizedListener(action, params, path, name) {
    const listener = (...args) => action(...params, ...args);

    const key = View.getAttrKey(path, name);
    this.parametrizedEventListeners.set(key, listener);
    return listener;
  }
  /** @private */


  removeParametrizedListeners(node, path) {
    for (const name in node.attrs) {
      if (this.hasParametrizedListener(path, name)) this.removeParametrizedListener(path, name);
    }

    for (const ndx in node.children) {
      const nextPath = path.concat([ndx]);
      const child = node.children[ndx];
      if (isElementNode(child)) this.removeParametrizedListeners(child, nextPath);
    }
  }
  /** @private */


  removeParametrizedListener(path, name) {
    const key = View.getAttrKey(path, name);
    this.parametrizedEventListeners.delete(key);
  }

}
const mount = (container, node, index = 0) => {
  let viewNode = node;
  if (isElementNode(node)) viewNode = h(view(node));
  const global = container.ownerDocument.defaultView;
  const renderingContext = container instanceof global.SVGElement ? svgRenderingContext() : defaultRenderingContext();
  const instance = View.instantiate(viewNode, renderingContext);
  instance.mount(container, index);
  return instance;
};

const decorator = fn => Inner => {
  let innerView;
  if (ViewDeclaration.isViewDeclaration(Inner)) innerView = Inner;else if (typeof Inner === 'string') innerView = view((state, _, children) => h(Inner, state, children));else innerView = view(Inner);
  const decorated = fn(innerView);
  if (ViewDeclaration.isViewDeclaration(decorated)) return decorated;else return view(decorated);
};

const index = index => {
  if (index == null) throw new Error("'indexBy' attribute of the List view must be defined as a string or function");
  if (index instanceof Function) return index;else return item => item[index];
};

const state = state => ({
  data: state.data || [],
  accessor: index(state.indexBy),
  render: state.render,
  mountPoint: null,
  initialized: false,
  views: [],
  index: [],
  prevData: []
});

const ItemRenderer = view(({
  render
}) => render);
const actions = {};

const normalizeDiffPatches = patches => {
  let ndx = 0;
  const result = [];
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = patches[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      const patch = _step.value;

      if (patch.added) {
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = patch.value[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            const value = _step2.value;
            result.push({
              added: true,
              value,
              index: ndx
            });
            ndx += 1;
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
              _iterator2.return();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }
      } else if (patch.removed) {
        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
          for (var _iterator3 = patch.value[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            const value = _step3.value;
            result.push({
              removed: true,
              value,
              index: ndx
            });
          }
        } catch (err) {
          _didIteratorError3 = true;
          _iteratorError3 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion3 && _iterator3.return != null) {
              _iterator3.return();
            }
          } finally {
            if (_didIteratorError3) {
              throw _iteratorError3;
            }
          }
        }
      } else {
        var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {
          for (var _iterator4 = patch.value[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            const value = _step4.value;
            result.push({
              value,
              index: ndx
            });
            ndx += 1;
          }
        } catch (err) {
          _didIteratorError4 = true;
          _iteratorError4 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion4 && _iterator4.return != null) {
              _iterator4.return();
            }
          } finally {
            if (_didIteratorError4) {
              throw _iteratorError4;
            }
          }
        }
      }
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

  const added = {};

  for (const i in result) {
    const patch = result[i];
    if (patch.added) added[patch.value] = i;
  }

  for (let i = 0; i < result.length; i++) {
    const patch = result[i];

    if (patch.removed && patch.value in added) {
      result.splice(i, 1);
      i--;
    }
  }

  return result;
};

actions.initialize = () => state => {
  const _state$mountPoint = _slicedToArray(state.mountPoint, 2),
        container = _state$mountPoint[0],
        mountIndex = _state$mountPoint[1];

  while (container.firstChild) container.firstChild.remove();

  state.initialized = true;
  state.index = [];
  state.views = {};

  for (const i in state.data) {
    const index = +i;
    const item = state.data[index];
    const key = state.accessor(item);
    state.index.push(key);
    const node = h(ItemRenderer, {
      render: state.render(item, index, state.data)
    });
    const instance = mount(container, node, mountIndex + index);
    state.views[key] = {
      view: instance,
      index: mountIndex + index
    };
  }

  requireUniqueIndex(state.index);
  state.prevData = state.data;
};

const requireUniqueIndex = index => {
  const map = {};
  var _iteratorNormalCompletion5 = true;
  var _didIteratorError5 = false;
  var _iteratorError5 = undefined;

  try {
    for (var _iterator5 = index[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
      const key = _step5.value;
      if (key in map) throw new Error('Item keys must be unique');
      map[key] = true;
    }
  } catch (err) {
    _didIteratorError5 = true;
    _iteratorError5 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion5 && _iterator5.return != null) {
        _iterator5.return();
      }
    } finally {
      if (_didIteratorError5) {
        throw _iteratorError5;
      }
    }
  }

  return index;
};

actions.diffUpdate = () => state => {
  const _state$mountPoint2 = _slicedToArray(state.mountPoint, 2),
        container = _state$mountPoint2[0],
        mountIndex = _state$mountPoint2[1];

  const index = state.data.map(state.accessor);
  requireUniqueIndex(index);
  const patches = diff.diffArrays(state.index, index);
  const normalizedPatches = normalizeDiffPatches(patches);
  const updated = {};

  for (const i in normalizedPatches) {
    const patch = normalizedPatches[i];
    const key = patch.value;
    const index = +patch.index;
    const updating = key in state.views;

    if (patch.added && key !== state.index[index]) {
      if (updating) {
        // swap to views
        const to = patch.index;
        const swapKey = state.index[to];
        const _state$views$key = state.views[key],
              from = _state$views$key.index,
              first = _state$views$key.view;
        const second = state.views[swapKey].view;
        first.move(container, to);
        if (state.prevData[from] !== state.data[to]) first.update({
          render: state.render(state.data[to], to, state.data)
        });
        second.move(container, from + 1);
        if (state.prevData[to] !== state.data[from]) second.update({
          render: state.render(state.data[from], to, state.data)
        });
        state.views[key] = {
          view: first,
          index: to
        };
        state.views[swapKey] = {
          view: second,
          index: from
        };
        updated[key] = true;
        updated[swapKey] = true;
      } else {
        // add new view
        const item = state.data[index];
        const node = h(ItemRenderer, {
          render: state.render(item, index, state.data)
        });
        const instance = mount(container, node, mountIndex + index);
        state.views[key] = {
          view: instance,
          index: mountIndex + index
        };
      }
    } else if (patch.removed) {
      // remove view
      const instance = state.views[key].view;
      instance.destroy();
      delete state.views[key];
    } else if (!(key in updated)) {
      // update view
      const item = state.data[index];
      if (item !== state.prevData[index]) state.views[key].view.update({
        render: state.render(item, index, state.data)
      });
    }
  }

  state.index = index;
  state.prevData = state.data;
};

actions.update = () => (state, actions) => {
  if (state.mountPoint == null) return;
  if (state.initialized) actions.diffUpdate();else actions.initialize();
};

const hooks = {};

hooks.mount = (mount$$1, state, actions) => {
  state.mountPoint = [mount$$1.parentNode, Array.prototype.indexOf.call(mount$$1.parentNode.childNodes, mount$$1)];
  actions.update();
};

hooks.update = (m, s, actions) => {
  actions.update();
};

hooks.unmount = (_, state) => {
  state.mountPoint = null;
  state.views = [];
  state.index = [];
};

const ListRenderer = view(null, state, actions, hooks);
const List = view((state, _, children) => {
  let render = children[0];
  if (children.length > 1) throw new Error('You must provide only one child to the List, it can be a render function or a jsx node');
  if (render == null) return null;
  render = render instanceof Function ? render : () => render;
  return h(ListRenderer, _objectSpread({}, state, {
    render
  }));
});
const Map$1 = view((state, _, children) => {
  let render = children[0];
  if (children.length > 1) throw new Error('You must provide only one child to the Map, it can be a render function or a jsx node');
  if (render == null) return null;
  render = render instanceof Function ? render : () => render;

  const mapRender = ([key, value]) => render(value);

  const data = malinaUtil.keys(state.data || {}).map(k => [k, state.data[k]]);

  const indexBy = ([k]) => k;

  return h(ListRenderer, {
    data,
    indexBy,
    render: mapRender
  });
}, {
  data: {}
});

exports.view = view;
exports.h = h;
exports.isElementNode = isElementNode;
exports.isViewNode = isViewNode;
exports.isTextNode = isTextNode;
exports.Node = Node;
exports.mount = mount;
exports.decorator = decorator;
exports.List = List;
exports.Map = Map$1;
