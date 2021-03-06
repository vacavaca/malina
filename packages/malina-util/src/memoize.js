const defaultIsEqual = (a, b) => a === b;

const checkParams = (prev, next, isEqual) => {
  const len = prev.length;
  if (len !== next.length)
    return false;

  for (let i = 0; i < len; i++) {
    if (!isEqual(prev[i], next[i]))
      return false;
  }

  return true;
};

const memoizeOne = (fn, isEqual) => {
  let prevParams = null;
  let prevResult = null;

  return (...args) => {
    if (prevParams === null || !checkParams(prevParams, args, isEqual))
      prevResult = fn(...args);
    prevParams = args;
    return prevResult;
  };
};

/**
 * Creste memoized function
 * @param {Function} fn function to memoize
 * @param {number} [length] memoizarion cache size (default 1)
 * @param {Function} [isEqual] equality checker function to use when
 * comparing arguments (default is strict equality check)
 * @returns {Function} function with enabled memoization
 */
export const memoize = (fn, length = 1, isEqual = defaultIsEqual) => {
  if (length === 1)
    return memoizeOne(fn, isEqual);

  if (length === 0)
    return fn;

  let prevParams = [];
  let prevResults = [];

  return (...args) => {
    for (let i = prevParams.length - 1; i >= 0; i--) {
      if (checkParams(prevParams[i], args, isEqual))
        return prevResults[i];
    }

    prevParams.push(args);
    const result = fn(...args);
    prevResults.push(result);
    if (prevParams.length > length) {
      prevParams.splice(0, 1);
      prevResults.splice(0, 1);
    }

    return result;
  };
};
