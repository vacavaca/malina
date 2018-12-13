let env = 'production'

try {
  env = process.env.NODE_ENV
} catch (ignore) { }

export const isProduction = env === 'production'

export const isDevelopment = !isProduction

/* eslint-disable no-undef, no-use-before-define */
const _global = (typeof self === 'object' && self.self === self && self) ||
  (typeof global === 'object' && global.global === global && global) ||
  this
/* eslint-enable no-undef, no-use-before-define */

const consoleAvailable = 'console' in _global
const warnAvailable = consoleAvailable && 'warn' in _global.console

export const warn = msg => {
  if (isDevelopment && warnAvailable)
    _global.console.warn(msg)
}
