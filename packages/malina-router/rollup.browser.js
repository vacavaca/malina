import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'

module.exports = {
  input: 'browser.js',
  output: {
    file: 'dist/index.browser.js',
    format: 'umd',
    name: 'malinaRouter',
    exports: 'named',
    globals: {
      malina: 'malina',
      'malina-util': 'malinaUtil',
      'malina-decorator': 'malinaDecorator'
    }
  },
  external: ['malina', 'malina-util', 'malina-decorator'],
  plugins: [
    babel(),
    resolve(),
    commonjs()
  ]
}
