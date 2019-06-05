
import seedrandom from 'seedrandom'

const base58 = '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ'

export class Random {
  constructor(seed = null) {
    this.rng = seed != null ? seedrandom(seed) : Math.random
  }

  double() {
    return this.rng()
  }

  id(length, seed = null) {
    let result = ''
    for (let i = 0; i < length; i++)
      result += base58[Math.round(this.rng() * (base58.length - 1))]

    return result
  }
}
