/* eslint-disable no-undef */
import assert from 'assert';
import { compose, keys, shallowEqual, omit, flatten, binarySearch } from '../index.js';

describe('misc', () => {
  describe('compose', () => {
    it('should return id when no args presented', () => {
      const test = {};
      const composed = compose();

      assert.strictEqual(composed(test), test);
    });

    it('should return same function when passed only one arg', () => {
      const test = () => { };
      const composed = compose(test);

      assert.strictEqual(composed, test);
    });

    it('should perform function composition', () => {
      const a = a => a + 3;
      const b = a => a * 2;

      const composed = compose(a, b);

      assert.strictEqual(composed(2), 10);
    });
  });

  describe('keys', () => {
    it('should collect object keys and symbols', () => {
      const a = 'a';
      const b = Symbol('test');
      const test = {
        [a]: 42,
        [b]: 'foo'
      };

      assert.deepStrictEqual(keys(test), [a, b]);
    });
  });

  describe('shallowEqual', () => {
    it('should shallowly compare object', () => {
      const a = [];
      const b = {};
      const s = Symbol('test');
      const t = Symbol('test');

      assert.ok(shallowEqual([], []));
      assert.ok(shallowEqual(a, a));
      assert.ok(shallowEqual(b, b));
      assert.ok(!shallowEqual([], {}));
      assert.ok(!shallowEqual(a, b));
      assert.ok(!shallowEqual(a, null));
      assert.ok(shallowEqual(null, null));
      assert.ok(!shallowEqual(b, null));
      assert.ok(!shallowEqual([1, 2, 3], [1, 2]));
      assert.ok(!shallowEqual([1, 3], [1, 2]));
      assert.ok(shallowEqual([1, 2], [1, 2]));
      assert.ok(!shallowEqual({}, { foo: 42 }));
      assert.ok(!shallowEqual({ foo: 43 }, { foo: 42 }));
      assert.ok(!shallowEqual({ foo: 43, test: 43 }, { foo: 42 }));
      assert.ok(shallowEqual({ foo: 42 }, { foo: 42 }));
      assert.ok(!shallowEqual({ [s]: 42 }, { foo: 42 }));
      assert.ok(!shallowEqual({ [s]: 43 }, { [s]: 42 }));
      assert.ok(shallowEqual({ [s]: 42 }, { [s]: 42 }));
      assert.ok(!shallowEqual({ foo: 42 }, { foo: 43 }));
      assert.ok(!shallowEqual({ foo: 42 }, { foo: 42, test: 43 }));
      assert.ok(!shallowEqual({ [s]: 42 }, { [s]: 42, [t]: 43 }));
    });
  });

  describe('omit', () => {
    it('should omit keys', () => {
      const test = {
        foo: 42,
        bar: 'foo',
        test: null
      };

      assert.deepStrictEqual(omit(['foo'], test), {
        bar: 'foo',
        test: null
      });
    });
  });

  describe('flatten', () => {
    it('should flatten arrays', () => {
      assert.deepStrictEqual(flatten([1, [2, [3, 4]], 5]), [1, 2, 3, 4, 5]);
    });
  });

  describe('binarySearch', () => {
    it('should do a binary search', () => {
      const a = [1, 2, 3, 4, 5, 6, 7];
      const b = [7, 6, 5, 4, 3, 2, 1];

      const reverseCmp = (a, b) => a > b ? -1 : (a < b ? 1 : 0);

      assert.strictEqual(binarySearch(3, a), 2);
      assert.strictEqual(binarySearch(3, [3]), 0);
      assert.strictEqual(binarySearch(3, [1]), -2);
      assert.strictEqual(binarySearch(3, []), -2);
      assert.strictEqual(binarySearch(3, [4]), -1);
      assert.strictEqual(binarySearch(3.5, a), -4);
      assert.strictEqual(binarySearch(3, b, reverseCmp), 4);
      assert.strictEqual(binarySearch(3.5, b, reverseCmp), -5);
    });
  });
});
