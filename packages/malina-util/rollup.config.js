import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'

module.exports = [
  {
    input: 'src/index.js',
    output: {
      file: 'dist/index.src.js',
      format: 'cjs'
    },
    plugins: [
      babel()
    ]
  },
  {
    input: 'dist/index.src.js',
    output: {
      file: 'dist/index.umd.js',
      format: 'umd',
      name: 'malinaUtil'
    },
    plugins: [
      resolve(),
      commonjs()
    ]
  }
]
