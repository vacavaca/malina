import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'

module.exports = {
  input: 'browser.js',
  output: {
    file: 'dist/index.browser.js',
    format: 'umd',
    name: 'malina',
    exports: 'named',
    globals: {
      'malina-util': 'malinaUtil'
    }
  },
  external: ['malina-util'],
  plugins: [
    babel(),
    resolve(),
    commonjs()
  ]
}
