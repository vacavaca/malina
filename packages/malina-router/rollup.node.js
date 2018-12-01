module.exports = {
  input: 'index.js',
  output: {
    file: 'dist/index.node.js',
    format: 'cjs'
  },
  external: ['malina', 'malina-util', 'malina-decorator', 'path-to-regexp']
}
