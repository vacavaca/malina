/**
 * Functional composition, from left to right
 *
 * @param  {...Function} fns functions to compose
 * @returns {Function} resulting composed functrion
 */
export const compose = (...fns) => {
  if (fns.length === 0)
    return arg => arg;

  if (fns.length === 1)
    return fns[0];

  return fns.reduce((a, b) => (...args) => b(a(...args)));
};

/**
 * Get object property names including property symbols
 *
 * @param {Object} obj object
 * @returns {Array} array of names and symbols
 */
export const keys = obj =>
  Object.getOwnPropertyNames(obj)
    .concat(Object.getOwnPropertySymbols(obj));

const shallowEqualArray = (a, b) => {
  if (a === b)
    return true;

  if ((a == null) !== (b == null))
    return false;

  if (a == null)
    return true;

  const len = a.length;
  if (len !== b.length)
    return false;

  for (let i = 0; i < len; i++) {
    if (a[i] !== b[i])
      return false;
  }

  return true;
};

const isEmptyIterableObject = a => {
  for (const k in a)
    return false;

  return true;
};

const shallowEqualObject = (a, b) => {
  if (a === b)
    return true;

  if ((a == null) !== (b == null))
    return false;

  if (a == null)
    return true;

  if (isEmptyIterableObject(a) !== isEmptyIterableObject(b))
    return false;

  for (const key of Object.getOwnPropertyNames(a)) {
    if (!(key in b) || a[key] !== b[key])
      return false;
  }

  for (const symbol of Object.getOwnPropertySymbols(a)) {
    if (!(symbol in b) || a[symbol] !== b[symbol])
      return false;
  }

  for (const key of Object.getOwnPropertyNames(b)) {
    if (!(key in a))
      return false;
  }

  for (const symbol of Object.getOwnPropertySymbols(b)) {
    if (!(symbol in a))
      return false;
  }

  return true;
};

/**
 * Shallowly compare two objects
 *
 * @param {Object} a first object
 * @param {Object} b second object
 * @returns {boolean} true if objects are shallow equal, false if not
 */
export const shallowEqual = (a, b) => {
  const aIsArray = Array.isArray(a);
  if (aIsArray !== Array.isArray(b))
    return false;

  return aIsArray ? shallowEqualArray(a, b) : shallowEqualObject(a, b);
};

/**
 * Get copy of an object excluding given keys
 *
 * @param {Array} keyToOmit array of keys to exclude
 * @param {Object} obj object to exclude kets from
 * @returns {Object} object without given keys
 */
export const omit = (keyToOmit, obj) => {
  const result = {};
  const index = {};
  const len = keyToOmit.length;
  let i = 0;

  while (i < len) {
    index[keyToOmit[i]] = true;
    i += 1;
  }

  for (const key of keys(obj)) {
    if (!(key in index))
      result[key] = obj[key];
  }

  return result;
};

/**
 * Flatten an array
 *
 * @param {Array} array
 * @returns {Array} flattened array
 */
export const flatten = array => {
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

const defaultCompare = (a, b) => (a > b ? 1 : (a < b ? -1 : 0));

/**
 * Search the specified value in the specified array using
 * binary search algorithm
 *
 * @param {*} value search value
 * @param {array} array array to search in
 * @param {Function} [compare] comparator to use,
 * default comparator uses js comparison operators
 * @returns {number} index of the search value
 * if it is contained in the array, otherwise
 * returns (-insert - 1) where insert is the
 * index at which value would be inserted into
 * the array or the index of the first element
 * in the array greater than provided value
 */
export const binarySearch = (value, array, compare = defaultCompare) => {
  if (array.length > 1) {
    let min = 0;
    let max = array.length - 1;

    while (min <= max) {
      const i = (min + max) >>> 1;
      const element = array[i];
      const comp = compare(element, value);

      if (comp < 0)
        min = i + 1;
      else if (comp > 0)
        max = i - 1;
      else return i;
    }

    return -min - 1;
  } else if (array.length === 1) {
    const cmp = compare(value, array[0]);
    if (cmp > 0) return -2;
    else if (cmp < 0) return -1;
    else return 0;
  } else return -2;
};
