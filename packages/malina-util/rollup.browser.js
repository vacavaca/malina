import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'

module.exports = {
  input: 'browser.js',
  output: {
    file: 'dist/index.browser.js',
    format: 'umd',
    name: 'malinaUtil',
    exports: 'named'
  },
  plugins: [
    babel(),
    resolve(),
    commonjs()
  ]
}
