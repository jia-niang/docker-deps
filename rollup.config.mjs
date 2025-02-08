import typescript from '@rollup/plugin-typescript'
import { defineConfig } from 'rollup'
import { dts } from 'rollup-plugin-dts'

export default defineConfig([
  {
    input: ['src/index.ts', 'src/docker-deps.ts'],
    output: { dir: 'dist', format: 'cjs' },
    external: () => true,
    plugins: [typescript({ declaration: false })],
  },
  {
    input: 'src/index.ts',
    output: { file: 'dist/index.d.ts', format: 'es' },
    plugins: [dts()],
  },
])
