import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-node-resolve'

import packageJson from './package.json'

module.exports = {
  input: 'index.js',
  output: {
    file: 'dist/index.node.js',
    format: 'cjs'
  },
  external: Object.keys(packageJson.dependencies),
  context: 'this',
  plugins: [
    resolve(),
    babel()
  ]
}
