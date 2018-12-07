'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const compose = (...fns) => {
  if (fns.length === 0) return arg => arg;
  if (fns.length === 1) return fns[0];
  return fns.reduce((a, b) => (...args) => a(b(...args)));
};
const keys = obj => Object.getOwnPropertyNames(obj).concat(Object.getOwnPropertySymbols(obj));
const shallowEqual = (a, b) => {
  if (a === b) return true;
  if (a == null !== (b == null)) return false;
  if (a == null) return true;
  const props = keys(a);
  const len = props.length;
  if (keys(b).length !== len) return false;
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = props[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      const key = _step.value;
      if (a[key] !== b[key]) return false;
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

  return true;
};
const omit = (names, obj) => {
  const result = {};
  const index = {};
  const len = names.length;
  let i = 0;

  while (i < len) {
    index[names[i]] = true;
    i += 1;
  }

  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = keys(obj)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      const key = _step2.value;
      if (!(key in index)) result[key] = obj[key];
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

  return result;
};
const flatten = array => {
  const result = [];
  const len = array.length;
  let i = 0;

  while (i < len) {
    if (Array.isArray(array[i])) {
      const value = flatten(array[i]);
      const nextLen = value.length;
      let j = 0;

      while (j < nextLen) {
        result[result.length] = value[j];
        j += 1;
      }
    } else result[result.length] = array[i];

    i += 1;
  }

  return result;
};

const delimiter = '-';

const getElementName = (block, element) => {
  if (element != null) return `${block}${delimiter}${element}`;else return block;
};

const getModifiers = modifiers => {
  if (Array.isArray(modifiers)) return modifiers.reduce((a, modifier) => ({
    [modifier]: true
  }), {});else if (typeof modifiers === 'string') return getModifiers(modifiers.split(' '));else return modifiers;
};

const classNames = (name, modifiers) => [name, ...Object.keys(modifiers).filter(k => !!modifiers[k]).map(k => `${name}${delimiter.repeat(2)}${k}`)].filter(c => !!c).join(' ');

const elementStep = (block, ...args) => {
  if (args.length === 1) {
    const arg = args[0];
    if (typeof arg === 'string') return getElementName(block, arg);else return classNames(block, getModifiers(arg));
  } else if (args.length === 2) {
    const element = args[0],
          modifiers = args[1];
    return classNames(getElementName(block, element), getModifiers(modifiers));
  } else throw new Error('Unrecognized arguments');
};

var classNames$1 = ((...args) => {
  if (args.length === 1) {
    const block = args[0];
    return (...args) => elementStep(block, ...args);
  } else return elementStep(...args);
});

exports.classNames = classNames$1;
exports.cn = classNames$1;
exports.compose = compose;
exports.keys = keys;
exports.shallowEqual = shallowEqual;
exports.omit = omit;
exports.flatten = flatten;
