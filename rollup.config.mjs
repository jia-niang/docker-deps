import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import { defineConfig } from 'rollup'
import del from 'rollup-plugin-delete'
import { dts } from 'rollup-plugin-dts'

export default defineConfig([
  {
    input: ['src/index.ts', 'src/docker-deps.ts'],
    output: { dir: 'dist', format: 'cjs' },
    plugins: [del({ targets: './dist/*' }), typescript({ declaration: false }), nodeResolve(), json(), commonjs()],
  },
  {
    input: 'src/index.ts',
    output: { file: 'dist/index.d.ts', format: 'es' },
    plugins: [dts()],
  },
])
