import babel from 'rollup-plugin-babel'

module.exports = {
  input: 'index.js',
  output: {
    file: 'dist/index.node.js',
    format: 'cjs'
  },
  plugins: [
    babel()
  ]
}
