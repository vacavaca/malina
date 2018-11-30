'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var malinaUtil = require('malina-util');

function _typeof(obj) {
  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function (obj) {
      return typeof obj;
    };
  } else {
    _typeof = function (obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

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

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
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

function _toConsumableArray(arr) {
  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread();
}

function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  }
}

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

function _iterableToArray(iter) {
  if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
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

function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance");
}

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance");
}

var ViewDeclaration = function ViewDeclaration(template, state, actions, hooks) {
  _classCallCheck(this, ViewDeclaration);

  this.template = template;
  this.state = state;
  this.actions = actions;
  this.hooks = hooks;
};
var view = function view(template) {
  var state = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  var actions = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
  var hooks = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
  return new ViewDeclaration(template instanceof Function ? template : function () {
    return template;
  }, state, actions, hooks);
};

var Node =
/*#__PURE__*/
function () {
  function Node(tag) {
    var attrs = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var children = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

    _classCallCheck(this, Node);

    if (tag == null) throw new Error('JSX tag empty ');
    this.tag = tag;
    this.attrs = attrs;
    this.children = children;
  }

  _createClass(Node, [{
    key: "toString",
    value: function toString() {
      var tagName = typeof this.tag === 'string' ? this.tag : 'View';
      return "".concat(tagName, " ").concat(JSON.stringify(this.attrs || {})).concat(this.children.length > 0 ? "\n".concat(this.children.map(function (c) {
        if (c == null) return "\t''";
        var str = c.toString();
        return str.split('\n').map(function (s) {
          return "\t".concat(s);
        }).join('\n');
      }).join('\n')) : '');
    }
  }]);

  return Node;
}();
var isViewNode = function isViewNode(node) {
  return node instanceof Node && node.tag instanceof ViewDeclaration;
};
var isElementNode = function isElementNode(node) {
  return node instanceof Node && !isViewNode(node);
};
var isTextNode = function isTextNode(node) {
  return typeof node === 'string';
};
var h = function h(tag, attrs) {
  for (var _len = arguments.length, children = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    children[_key - 2] = arguments[_key];
  }

  var childrenArray = children.length === 1 && Array.isArray(children[0]) ? children[0] : children;
  return new Node(tag, attrs, childrenArray);
};

var toOnEventName = function toOnEventName(event) {
  return "on".concat(event[0].toUpperCase()).concat(event.substr(1));
};
var normalizeEventName = function normalizeEventName(name) {
  var lower = name.toLowerCase();
  return lower.startsWith('on') ? lower.substr(2) : lower;
};

var RenderingContext = function RenderingContext(_ref) {
  var _ref$isSvg = _ref.isSvg,
      isSvg = _ref$isSvg === void 0 ? false : _ref$isSvg;

  _classCallCheck(this, RenderingContext);

  this.isSvg = isSvg;
};

var isParametrizedAction = function isParametrizedAction(value) {
  return Array.isArray(value) && value.length === 2 && value[0] instanceof Function;
};

var isSameParametrizedAction = function isSameParametrizedAction(a, b) {
  return isParametrizedAction(a) && isParametrizedAction(b) && a[0] === b[0] && a[1] === b[1];
};

var mountLock = false;
var mountHookQueue = [];
var defaultRenderingContext = new RenderingContext({});
var svgRenderingContext = new RenderingContext({
  isSvg: true
});

var isRoot = function isRoot(path) {
  return path.length === 0;
};

var isSameViewNode = function isSameViewNode(a, b) {
  return a.tag === b.tag;
};

var isValidChildren = function isValidChildren(children) {
  return children.every(function (node, i) {
    return i === 0 || !isViewNode(node) || !isViewNode(children[i - 1]) || node.attrs.key || !isSameViewNode(node, children[i - 1]);
  });
};

var View =
/*#__PURE__*/
function () {
  function View(node, renderingContext) {
    _classCallCheck(this, View);

    var declaration = node.tag,
        state = node.attrs,
        children = node.children;
    var declaredState = declaration.state instanceof Function ? declaration.state(state) : declaration.state;
    var declaredActions = declaration.actions instanceof Function ? declaration.actions(state) : declaration.actions;
    var declaredHooks = declaration.hooks instanceof Function ? declaration.hooks(state) : declaration.hooks;
    this.template = declaration.template;
    this.state = _objectSpread({}, declaredState || {}, state || {});
    this.actions = this.bindActions(declaredActions || {});
    this.children = children;
    this.hooks = declaredHooks || {};
    this.renderingContext = renderingContext || defaultRenderingContext;
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
    this.container = this.callHook('create');
  }

  _createClass(View, [{
    key: "mount",
    value: function mount(container, index) {
      var _this = this;

      var document = container.ownerDocument;
      if (this.destroyed) return;
      var top = false;

      if (!mountLock) {
        mountLock = true;
        top = true;
      }

      var next = this.renderTemplate();
      if (Array.isArray(next)) throw new Error('View can only have one root element');

      if (isElementNode(next)) {
        if (next.tag === 'svg') this.renderingContext = svgRenderingContext;
        var element = this.mountNodeElement(container, index, next, []);
        this.element = element;
      } else if (isViewNode(next)) {
        var _view = this.instantiateInnerView(next, []);

        _view.mount(container, index);

        this.element = _view.element;
      } else {
        var _element = document.createTextNode("".concat(next != null ? next : ''));

        this.element = _element;
        var before = container.childNodes[index] || null;
        container.insertBefore(_element, before);
      }

      this.node = next;
      this.mounted = true;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.scheduledActions[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var _step$value = _slicedToArray(_step.value, 2),
              action = _step$value[0],
              args = _step$value[1];

          this.callAction.apply(this, [action].concat(_toConsumableArray(args)));
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

      this.scheduledActions = [];

      if (top) {
        for (var _i = 0; _i < mountHookQueue.length; _i++) {
          var hook = mountHookQueue[_i];
          hook();
        }

        this.callHook('mount');
        mountLock = false;
      } else mountHookQueue.push(function () {
        return _this.callHook('mount');
      });
    }
  }, {
    key: "update",
    value: function update() {
      var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
      var children = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      if (this.destroyed) throw new Error('View has been destroyed');
      var nextState = this.updateState(state);
      var nextChildren = this.updateChildrenState(children);
      var update = this.state !== nextState || this.children !== nextChildren;
      this.state = nextState;
      this.children = nextChildren;

      if (this.mounted && update) {
        this.refresh();
        this.callHook('update');
      }

      return update;
    }
  }, {
    key: "refresh",
    value: function refresh() {
      var next = this.renderTemplate();
      var prev = this.node;
      this.node = next;
      this.patch(this.element, prev, next, []);
    }
  }, {
    key: "unmount",
    value: function unmount(removeElement) {
      this.mounted = false;
      if (isElementNode(this.node)) this.destroyInnerViews(this.node, []);else if (isViewNode(this.node)) this.destroyInnerView([]);
      if (removeElement) this.element.remove();
      this.callHook('unmount');
      this.element = null;
    }
  }, {
    key: "destroy",
    value: function destroy(removeElement) {
      this.unmount(removeElement);
      this.callHook('destroy');
      this.destroyed = true;
    }
    /** @private */

  }, {
    key: "renderTemplate",

    /** @private */
    value: function renderTemplate() {
      this.templateLock = true;
      var next = this.template(this.state, this.actions, this.children);
      if (Array.isArray(next)) throw new Error('Only one root element must be rendered for a view');
      next = next != null ? next : '';
      this.templateLock = false;
      return next;
    }
    /** @private */

  }, {
    key: "bindActions",
    value: function bindActions(actions) {
      var _this2 = this;

      var bound = {};
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        var _loop = function _loop() {
          var key = _step2.value;
          var action = actions[key];
          if (action instanceof Function) bound[key] = function () {
            for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
              args[_key] = arguments[_key];
            }

            return _this2.callAction.apply(_this2, [actions[key]].concat(args));
          };else bound[key] = _this2.bindActions(action);
        };

        for (var _iterator2 = malinaUtil.keys(actions)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          _loop();
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

      return bound;
    }
    /** @private */

  }, {
    key: "callAction",
    value: function callAction(action) {
      var _this3 = this;

      if (this.templateLock) throw new Error("Actions can't be called while rendering view template");

      for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        args[_key2 - 1] = arguments[_key2];
      }

      if (this.mounted) {
        var update = !this.updateLock;
        this.updateLock = true;
        var result = action.apply(void 0, args)(this.state, this.actions);

        if (result instanceof Promise) {
          this.updateLock = false;
          if (this.trackedActionUpdate) this.refresh();
          this.trackedActionUpdate = false;
          return _asyncToGenerator(
          /*#__PURE__*/
          regeneratorRuntime.mark(function _callee() {
            var state;
            return regeneratorRuntime.wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    _context.next = 2;
                    return result;

                  case 2:
                    state = _context.sent;
                    if (!_this3.destroyed) _this3.update(state);
                    return _context.abrupt("return", _this3.state);

                  case 5:
                  case "end":
                    return _context.stop();
                }
              }
            }, _callee, this);
          }))();
        } else {
          if (update) {
            if (!this.destroyed && this.mounted) {
              var updated = this.update(result);
              if (!updated && this.trackedActionUpdate) this.refresh();
              this.trackedActionUpdate = false;
            } else if (!this.destroyed) this.state = this.updateState(result);
          } else {
            var nextState = this.updateState(result);
            this.trackedActionUpdate = this.trackedActionUpdate || this.state !== nextState;
            this.state = nextState;
          }

          this.updateLock = false;
          return this.state;
        }
      } else this.scheduledActions.push([action, args]);
    }
    /** @private */

  }, {
    key: "updateState",
    value: function updateState() {
      var update = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
      if (update == null || update === this.state) return this.state;
      var nextState = update !== null ? _objectSpread({}, this.state, update) : this.state;
      return !malinaUtil.shallowEqual(this.state, nextState) ? nextState : this.state;
    }
    /** @private */

  }, {
    key: "updateChildrenState",
    value: function updateChildrenState() {
      var children = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
      if (children === null || children === null) return this.children;
      var selfEmpty = this.children == null || this.children.length === 0;
      var nextEmpty = children.length === 0;
      if (selfEmpty !== nextEmpty) return children;else return !malinaUtil.shallowEqual(this.children, children) ? children : this.children;
    }
    /** @private */

  }, {
    key: "callHook",
    value: function callHook(hook) {
      if (hook in this.hooks) this.hooks[hook](this.element, this.state, this.actions);
    }
    /** @private */

  }, {
    key: "patch",
    value: function patch(element, prev, next, path) {
      if (prev === next) return;

      if (isElementNode(prev)) {
        if (next == null) this.patchFromNodeToNone(element, prev, path);else if (isElementNode(next)) this.patchFromNodeToNode(element, prev, next, path);else if (isViewNode(next)) this.patchFromNodeToView(element, prev, next, path);else this.patchFromNodeToText(element, prev, next, path);
      } else if (isViewNode(prev)) {
        if (next == null) this.patchFromViewToNone(element, prev, path);else if (isElementNode(next)) this.patchFromViewToNode(element, prev, next, path);else if (isViewNode(next)) this.patchFromViewToView(element, prev, next, path);else this.patchFromViewToText(element, prev, next, path);
      } else {
        if (next == null) this.patchFromTextToNone(element, path);else if (isElementNode(next)) this.patchFromTextToNode(element, next, path);else if (isViewNode(next)) this.patchFromTextToView(element, next, path);else this.patchTextNodes(element, prev, next, path);
      }
    }
    /** @private */

  }, {
    key: "patchFromTextToNone",
    value: function patchFromTextToNone(element, path) {
      if (isRoot(path)) throw new Error('Root element deleted during patch');
      element.parentNode.removeChild(element);
    }
    /** @private */

  }, {
    key: "patchTextNodes",
    value: function patchTextNodes(element, prev, next, path) {
      if (prev !== next) {
        var newElement = element.ownerDocument.createTextNode("".concat(next));
        element.replaceWith(newElement);
        if (isRoot(path)) this.element = newElement;
      }
    }
    /** @private */

  }, {
    key: "patchFromTextToNode",
    value: function patchFromTextToNode(element, next, path) {
      var newElement = this.createNodeElement(element.ownerDocument, next, path);
      element.replaceWith(newElement);
      if (isRoot(path)) this.element = newElement;
    }
    /** @private */

  }, {
    key: "patchFromTextToView",
    value: function patchFromTextToView(element, next, path) {
      var view$$1 = this.instantiateInnerView(next, path);
      var index = Array.from(element.parentNode.childNodes).findIndex(function (n) {
        return n === element;
      });
      var parent = element.parentNode;
      element.remove();
      view$$1.mount(parent, index);
      if (isRoot(path)) this.element = view$$1.element;
    }
    /** @private */

  }, {
    key: "patchFromNodeToNone",
    value: function patchFromNodeToNone(element, prev, path) {
      if (isRoot(path)) throw new Error('Root element deleted during patch');
      this.removeParametrizedListeners(prev, path);
      this.destroyInnerViews(prev, path);
      element.remove();
    }
    /** @private */

  }, {
    key: "patchFromNodeToText",
    value: function patchFromNodeToText(element, prev, next, path) {
      this.removeParametrizedListeners(prev, path);
      this.destroyInnerViews(prev, path);
      var newElement = element.ownerDocument.createTextNode("".concat(next));
      element.replaceWith(newElement);
      if (isRoot(path)) this.element = newElement;
    }
    /** @private */

  }, {
    key: "patchFromNodeToNode",
    value: function patchFromNodeToNode(element, prev, next, path) {
      if (prev === next) return;

      if (prev.tag === next.tag) {
        this.updateAttributes(element, prev, next, path);
        this.updateChildren(element, prev, next, path);
      } else {
        this.removeParametrizedListeners(prev, path);
        this.destroyInnerViews(prev, path);
        var newElement = this.createNodeElement(element.ownerDocument, next, path);
        element.replaceWith(newElement);
        if (isRoot(path)) this.element = newElement;
      }
    }
    /** @private */

  }, {
    key: "patchFromNodeToView",
    value: function patchFromNodeToView(element, prev, next, path) {
      this.removeParametrizedListeners(prev, path);
      this.destroyInnerViews(prev, path);
      var view$$1 = this.instantiateInnerView(next, path);
      var index = Array.from(element.parentNode.childNodes).findIndex(function (n) {
        return n === element;
      });
      var parent = element.parentNode;
      element.remove();
      view$$1.mount(parent, index);
      if (isRoot(path)) this.element = view$$1.element;
    }
    /** @private */

  }, {
    key: "patchFromViewToNone",
    value: function patchFromViewToNone(element, prev, path) {
      if (isRoot(path)) throw new Error('Root element deleted during patch');
      this.destroyInnerView(path);
      element.remove();
    }
    /** @private */

  }, {
    key: "patchFromViewToText",
    value: function patchFromViewToText(element, prev, next, path) {
      this.destroyInnerView(path);
      var newElement = element.ownerDocument.createTextNode("".concat(next));
      element.replaceWith(newElement);
      if (isRoot(path)) this.element = newElement;
    }
    /** @private */

  }, {
    key: "patchFromViewToNode",
    value: function patchFromViewToNode(element, prev, next, path) {
      this.destroyInnerView(path);
      var newElement = this.createNodeElement(element.ownerDocument, next, path);
      element.replaceWith(newElement);
      if (isRoot(path)) this.element = newElement;
    }
    /** @private */

  }, {
    key: "patchFromViewToView",
    value: function patchFromViewToView(element, prev, next, path) {
      if (prev === next) return;

      if (isSameViewNode(prev, next) && prev.attrs.key === next.attrs.key) {
        var _view2 = this.getInstantiatedView(path);

        _view2.update(next.attrs, next.children);
      } else {
        this.destroyInnerView(path);

        var _view3 = this.instantiateInnerView(next, path);

        var index = Array.from(element.parentNode.childNodes).findIndex(function (n) {
          return n === element;
        });
        var parent = element.parentNode;
        element.remove();

        _view3.mount(parent, index);

        if (isRoot(path)) this.element = _view3.element;
      }
    }
    /** @private */

  }, {
    key: "unmountPatch",
    value: function unmountPatch() {
      this.mounted = false;
      this.callHook('unmount');
      this.element = null;
    }
    /** @private */

  }, {
    key: "destroyInnerViews",
    value: function destroyInnerViews(node, path) {
      for (var ndx in node.children) {
        var nextPath = path.concat([ndx]);
        var child = node.children[ndx];
        if (isViewNode(child)) this.destroyInnerView(nextPath);else if (isElementNode(child)) this.destroyInnerViews(child, nextPath);
      }
    }
    /** @private */

  }, {
    key: "destroyInnerView",
    value: function destroyInnerView(path) {
      var view$$1 = this.getInstantiatedView(path);
      view$$1.destroy(false);
      this.removeInstantiatedView(path);
    }
    /** @private */

  }, {
    key: "createNodeElement",
    value: function createNodeElement(document, node, path) {
      var element;
      if (this.renderingContext.isSvg) element = document.createElementNS('http://www.w3.org/2000/svg', node.tag);else element = document.createElement(node.tag);
      this.refreshAttributes(element, node, path);
      this.refreshChildren(element, node, path);
      return element;
    }
    /** @private */

  }, {
    key: "mountNodeElement",
    value: function mountNodeElement(container, index, node, path) {
      var document = container.ownerDocument;
      var element;
      if (this.renderingContext.isSvg) element = document.createElementNS('http://www.w3.org/2000/svg', node.tag);else element = document.createElement(node.tag);
      this.refreshAttributes(element, node, path);
      var before = container.childNodes[index] || null;
      container.insertBefore(element, before);
      this.refreshChildren(element, node, path, true);
      return element;
    }
    /** @private */

  }, {
    key: "refreshAttributes",
    value: function refreshAttributes(element, node, path) {
      for (var name in node.attrs) {
        var value = node.attrs[name];
        this.addAttribute(element, name, value, path);
      }
    }
    /** @private */

  }, {
    key: "updateAttributes",
    value: function updateAttributes(element, prev, next, path) {
      if (prev === next) return;

      for (var name in next.attrs) {
        var nextValue = next.attrs[name];

        if (name in prev.attrs) {
          var prevValue = prev.attrs[name];
          this.updateAttribute(element, name, prevValue, nextValue, path);
        } else this.addAttribute(element, name, nextValue, path);
      }

      for (var _name in prev.attrs) {
        if (!(_name in next.attrs)) this.removeAttribute(element, _name, prev.attrs[_name], path);
      }
    }
    /** @private */

  }, {
    key: "addAttribute",
    value: function addAttribute(element, name, value, path) {
      if (name === 'style') {
        for (var prop in value) {
          this.setStyleProp(element, prop, value[prop] || '');
        }
      } else if (value instanceof Function) this.addEventListener(element, normalizeEventName(name), value);else if (isParametrizedAction(value)) {
        var listener = this.createParametrizedListener(value[0], value[1], path, name);
        var event = normalizeEventName(name);
        this.addEventListener(element, event, listener);
      } else if (name === 'data' && value != null && _typeof(value) === 'object') {
        for (var key in value) {
          element.dataset[key] = value[key];
        }
      } else if (name !== 'focus' && name in element && !this.renderingContext.isSvg && value != null) element[name] = value;else if (typeof value === 'boolean') {
        if (name === 'focus' && element.focus && element.blur) {
          if (value) element.focus();else element.blur();
        } else element.setattribute(name, name);
      } else if (value != null) element.setAttribute(name, value);
    }
    /** @private */

  }, {
    key: "updateAttribute",
    value: function updateAttribute(element, name, prev, next, path) {
      if (prev === next) return;
      if (isSameParametrizedAction(prev, next)) return;

      if (name === 'style') {
        for (var prop in prev) {
          if (!(prop in next)) this.removeStyleProp(element, prop);
        }

        for (var _prop in next) {
          var style = next[_prop] || '';
          this.setStyleProp(element, _prop, style);
        }
      } else if (next instanceof Function) {
        this.removeAttribute(element, name, prev, path);
        this.addAttribute(element, name, next, path);
      } else if (isParametrizedAction(next)) {
        this.removeAttribute(element, name, prev, path);
        this.addAttribute(element, name, next, path);
      } else if (name === 'data') {
        var prevObject = prev != null && _typeof(prev) === 'object';
        var nextObject = next != null && _typeof(next) === 'object';

        if (prevObject && nextObject) {
          for (var key in prev) {
            if (!(key in next)) delete element.dataset[key];
          }

          for (var _key3 in next) {
            element.dataset[_key3] = next[_key3];
          }
        } else if (prevObject && !nextObject) {
          for (var _key4 in element.dataset) {
            delete element.dataset[_key4];
          }
        } else if (!prevObject && nextObject) {
          for (var _key5 in next) {
            element.dataset[_key5] = next[_key5];
          }
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
        if (next != null) element.setAttribute(name, next);else element.removeAttribute(next);
      }
    }
    /** @private */

  }, {
    key: "removeAttribute",
    value: function removeAttribute(element, name, prev, path) {
      if (name === 'style') element.style.cssText = '';else if (prev instanceof Function) {
        var event = normalizeEventName(name);
        this.removeEventListener(element, event, prev);
      } else if (isParametrizedAction(prev)) {
        var listener = this.getParametrizedListener(path, name);

        var _event = normalizeEventName(name);

        this.removeEventListener(element, _event, listener);
      } else if (name === 'data' && prev != null && _typeof(prev) === 'object') {
        for (var key in element.dataset) {
          delete element.dataset[key];
        }
      } else if (name !== 'focus' && name in element && !this.renderingContext.isSvg) element[name] = undefined;else if (typeof prev === 'boolean') {
        if (name === 'focus' && element.blur) element.blur();else element.removeAttribute(name);
      } else if (prev != null) element.removeAttribute(name);
    }
    /** @private */

  }, {
    key: "setStyleProp",
    value: function setStyleProp(element, prop, style) {
      if (prop[0] === '-') {
        var importantNdx = style.indexOf('!important');
        var clearedStyle = style;
        if (importantNdx !== -1) clearedStyle = importantNdx !== style.slice(0, importantNdx) + style.slice(importantNdx + 10);
        clearedStyle = clearedStyle.trim().replace(/;$/, '');
        element.style.setProperty(prop, clearedStyle);
      } else element.style[prop] = style;
    }
    /** @private */

  }, {
    key: "removeStyleProp",
    value: function removeStyleProp(element, prop) {
      if (prop[0] === '-') element.style.removeProperty(prop);else delete element.style[prop];
    }
    /** @private */

  }, {
    key: "addEventListener",
    value: function addEventListener(element, event, listener) {
      if (element.addEventListener) element.addEventListener(event, listener);else if (element.attachEvent) element.attachEvent(toOnEventName(event), listener);else {
        var listeners = element[event] && element[event].listeners || [];
        if (element[event] != null) element[event].listeners = listeners.concat(listener);else {
          var handler = function handler() {
            for (var _len3 = arguments.length, args = new Array(_len3), _key6 = 0; _key6 < _len3; _key6++) {
              args[_key6] = arguments[_key6];
            }

            return element[event].listeners.map(function (f) {
              return f.apply(void 0, args);
            });
          };

          handler.listeners = listeners.concat(listener);
          element[event] = handler;
        }
      }
    }
    /** @private */

  }, {
    key: "removeEventListener",
    value: function removeEventListener(element, event, listener) {
      if (element.removeEventListener) element.removeEventListener(event, listener);else if (element.detachEvent) element.detachEvent(toOnEventName(event), listener);else {
        if (element[event] != null && element[event].listeners != null) element[event].listeners = element[event].listener.filter(function (l) {
          return l !== listener;
        });
      }
    }
    /** @private */

  }, {
    key: "refreshChildren",
    value: function refreshChildren(element, node, path) {
      var mount = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
      if (!isValidChildren(node.children)) throw new Error("Every view node in an array must have an unique 'key' attribute");

      for (var ndx in node.children) {
        var child = node.children[ndx];
        var nextPath = path.concat([ndx]);
        this.addChildren(element, child, ndx, nextPath, mount);
      }
    }
    /** @private */

  }, {
    key: "addChildren",
    value: function addChildren(element, child) {
      var ndx = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
      var path = arguments.length > 3 ? arguments[3] : undefined;
      var mount = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;

      if (isElementNode(child)) {
        if (mount) this.mountNodeElement(element, null, child, path);else {
          var childElement = this.createNodeElement(element.ownerDocument, child, path);
          element.appendChild(childElement);
        }
      } else if (isViewNode(child)) {
        var _view4 = this.instantiateInnerView(child, path);

        _view4.mount(element, ndx);
      } else if (child != null) {
        var _childElement = element.ownerDocument.createTextNode("".concat(child));

        element.appendChild(_childElement);
      }
    }
    /** @private */

  }, {
    key: "updateChildren",
    value: function updateChildren(element, prev, next, path) {
      if (prev === next) return;
      if (!isValidChildren(next.children)) throw new Error("Every view node in an array must have an unique 'key' attribute");
      var len = Math.max(prev.children.length, next.children.length);
      var nodeIndexShift = 0;

      for (var ndx = 0; ndx < len; ndx++) {
        var childNode = element.childNodes[ndx - nodeIndexShift];
        var prevChild = prev.children[ndx];
        var nextChild = ndx in next.children ? next.children[ndx] : null;
        var nextPath = path.concat([ndx]);

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

  }, {
    key: "instantiateInnerView",
    value: function instantiateInnerView(node, path) {
      var key = View.getPathKey(path);
      var view$$1 = View.instantiate(node, this.renderingContext);
      this.innerViews.set(key, {
        view: view$$1,
        path: path.slice()
      });
      return view$$1;
    }
    /** @private */

  }, {
    key: "getInstantiatedView",
    value: function getInstantiatedView(path) {
      var key = View.getPathKey(path);
      var entry = this.innerViews.get(key);
      return entry != null ? entry.view : null;
    }
    /** @private */

  }, {
    key: "removeInstantiatedView",
    value: function removeInstantiatedView(path) {
      var key = View.getPathKey(path);
      this.innerViews.delete(key);
    }
    /** @private */

  }, {
    key: "getParametrizedListener",
    value: function getParametrizedListener(path, name) {
      var key = View.getAttrKey(path, name);
      return this.parametrizedEventListeners.get(key);
    }
    /** @private */

  }, {
    key: "hasParametrizedListener",
    value: function hasParametrizedListener(path, name) {
      var key = View.getAttrKey(path, name);
      return this.parametrizedEventListeners.has(key);
    }
    /** @private */

  }, {
    key: "createParametrizedListener",
    value: function createParametrizedListener(action, params, path, name) {
      var listener = function listener() {
        for (var _len4 = arguments.length, args = new Array(_len4), _key7 = 0; _key7 < _len4; _key7++) {
          args[_key7] = arguments[_key7];
        }

        return action.apply(void 0, _toConsumableArray(params).concat(args));
      };

      var key = View.getAttrKey(path, name);
      this.parametrizedEventListeners.set(key, listener);
      return listener;
    }
    /** @private */

  }, {
    key: "removeParametrizedListeners",
    value: function removeParametrizedListeners(node, path) {
      for (var name in node.attrs) {
        if (this.hasParametrizedListener(path, name)) this.removeParametrizedListener(path, name);
      }

      for (var ndx in node.children) {
        var nextPath = path.concat([ndx]);
        var child = node.children[ndx];
        if (isElementNode(child)) this.removeParametrizedListeners(child, nextPath);
      }
    }
    /** @private */

  }, {
    key: "removeParametrizedListener",
    value: function removeParametrizedListener(path, name) {
      var key = View.getAttrKey(path, name);
      this.parametrizedEventListeners.delete(key);
    }
  }], [{
    key: "instantiate",
    value: function instantiate(node) {
      var renderingContext = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      if (!isViewNode(node)) throw new Error('View can only be instantiated from view-nodes');
      return new View(node, renderingContext);
    }
  }, {
    key: "getPathKey",
    value: function getPathKey(path) {
      return path.join('.');
    }
    /** @private */

  }, {
    key: "getAttrKey",
    value: function getAttrKey(path, name) {
      return "".concat(name, ".").concat(View.getPathKey(path));
    }
  }]);

  return View;
}();
var mount = function mount(container, node) {
  var index = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
  var viewNode = node;
  if (isElementNode(node)) viewNode = h(view(node));
  var global = container.ownerDocument.defaultView;
  var renderingContext = container instanceof global.SVGElement ? svgRenderingContext : defaultRenderingContext;
  var instance = View.instantiate(viewNode, renderingContext);
  instance.mount(container, index);
  return instance;
};

var decorator = function decorator(fn) {
  return function (Inner) {
    var innerView;
    if (Inner instanceof ViewDeclaration) innerView = Inner;else if (typeof Inner === 'string') innerView = view(function (state, _, children) {
      return h(Inner, state, children);
    });else innerView = view(Inner);
    var decorated = fn(innerView);
    if (decorated instanceof ViewDeclaration) return decorated;else return view(decorated);
  };
};

exports.view = view;
exports.h = h;
exports.isElementNode = isElementNode;
exports.isViewNode = isViewNode;
exports.isTextNode = isTextNode;
exports.Node = Node;
exports.mount = mount;
exports.decorator = decorator;
