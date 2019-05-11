let env = 'production'

try {
  env = process.env.NODE_ENV
} catch (ignore) { }

export const testDevelopment = env => env === 'development' || env === 'testing'

// this must stay static
export const isDevelopment = env === 'development' || env === 'testing'

export const isProduction = !isDevelopment

/* eslint-disable no-undef, no-use-before-define */
const _global = (typeof self === 'object' && self.self === self && self) ||
  (typeof global === 'object' && global.global === global && global) ||
  this
/* eslint-enable no-undef, no-use-before-define */

const consoleAvailable = 'console' in _global
const warnAvailable = consoleAvailable && 'warn' in _global.console
const logAvailable = consoleAvailable && 'log' in _global.console

export const warn = msg => {
  if (isDevelopment && warnAvailable)
    _global.console.warn(msg)
}

export const log = (...args) => {
  if (isDevelopment && logAvailable)
    _global.console.log(...args)
}

export const getGlobal = () => _global

export const assert = (condition, msg = null) => {
  if (isDevelopment && warnAvailable) {
    if (!condition())
      throw new Error(`Condition failed${msg != null ? `: ${msg}` : ''}`)
  }
}
