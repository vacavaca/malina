const commonJs = require('rollup-plugin-commonjs')
const nodeResolve = require('rollup-plugin-node-resolve')

module.exports = {
  input: 'src/index.js',
  output: {
    file: 'dist/index.src.js',
    format: 'umd',
    name: 'malina'
  },
  plugins: [
    // commonJs({
    //   ignoreGlobal: true,
    //   sourceMap: false,
    // }),
    // nodeResolve(),
  ]
};