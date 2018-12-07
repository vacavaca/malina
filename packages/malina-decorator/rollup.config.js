import babel from 'rollup-plugin-babel'

module.exports = {
  input: 'index.js',
  output: {
    file: 'dist/index.node.js',
    format: 'cjs'
  },
  external: ['malina', 'malina-util'],
  plugins: [
    babel()
  ]
}
