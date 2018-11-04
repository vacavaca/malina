const babel = require('rollup-plugin-babel')

module.exports = {
  input: 'src/index.js',
  output: {
    file: 'dist/index.src.js',
    format: 'umd',
    name: 'malina'
  },
  plugins: [babel()]
};