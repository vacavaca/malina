import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-node-resolve'

module.exports = {
  input: 'index.js',
  output: {
    file: 'dist/index.node.js',
    format: 'cjs'
  },
  external: ['malina-util', 'diff'],
  context: 'this',
  plugins: [
    resolve(),
    babel()
  ]
}
