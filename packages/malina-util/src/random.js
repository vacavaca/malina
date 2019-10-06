
import seedrandom from 'seedrandom';

const base58 = '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Pseudo-Random Number Generator
 */
export class Random {
  /**
   * @constructor
   * @param {string|null} [seed] seed
   */
  constructor(seed = null) {
    this.rng = seed != null ? seedrandom(seed) : Math.random;
  }

  /**
   * Generate double
   *
   * @returns {number}
   */
  double() {
    return this.rng();
  }

  /**
   * Generate random string with the given length
   * using random integers and base58 encoding
   *
   * @param {number} length id length
   * @returns {string} generated id string
   */
  id(length) {
    let result = '';
    for (let i = 0; i < length; i++)
      result += base58[Math.round(this.rng() * (base58.length - 1))];

    return result;
  }
}
