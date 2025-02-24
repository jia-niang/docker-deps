import { afterEach, describe, expect, test } from '@jest/globals'
import { execSync } from 'child_process'
import { dockerDeps, dockerDepsSync } from 'docker-deps'
import { existsSync, rmSync } from 'fs'
import { resolve } from 'path'

describe('Usage with single-repo', () => {
  const fixtureDir = '__fixtures__/single-repo'
  const cwd = resolve(process.cwd(), fixtureDir)
  const cmd = `node ./dist/docker-deps.js ` + fixtureDir

  afterEach(() => {
    rmSync(resolve(cwd, '.docker-deps'), { recursive: true, force: true })
    rmSync(resolve(cwd, '.customize-output'), { recursive: true, force: true })
  })

  test('[API] Common synchronization usage', () => {
    dockerDepsSync({ cwd })
    expect(existsSync(resolve(cwd, '.docker-deps/package.json'))).toBe(true)
  })

  test('[API] Common asynchronous usage', async () => {
    await dockerDeps({ cwd })
    expect(existsSync(resolve(cwd, '.docker-deps/package.json'))).toBe(true)
  })

  test('[API] Use the "output" option', () => {
    dockerDepsSync({ cwd, output: '.customize-output/multiple-dir' })

    expect.assertions(2)
    expect(existsSync(resolve(cwd, '.customize-output/multiple-dir/package.json'))).toBe(true)
    expect(existsSync(resolve(cwd, '.docker-deps/package.json'))).toBe(false)
  })

  test('[API] Dry run', () => {
    dockerDepsSync({ cwd, output: '.should-not-exist', dryRun: true })
    expect(existsSync(resolve(cwd, '.should-not-exist'))).toBe(false)
  })

  test('[CLI] Common usage', () => {
    execSync(cmd)
    expect(existsSync(resolve(cwd, '.docker-deps/package.json'))).toBe(true)
  })

  test('[CLI] Use the "output" option', () => {
    execSync(cmd + ' -o .customize-output/multiple-dir')

    expect.assertions(2)
    expect(existsSync(resolve(cwd, '.customize-output/multiple-dir/package.json'))).toBe(true)
    expect(existsSync(resolve(cwd, '.docker-deps/package.json'))).toBe(false)
  })

  test('[CLI] Dry run', () => {
    execSync(cmd + ' -o .should-not-exist -d')
    expect(existsSync(resolve(cwd, '.should-not-exist'))).toBe(false)
  })
})
