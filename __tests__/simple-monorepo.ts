import { dockerDeps, dockerDepsSync } from '../dist/index'
import { afterEach, describe, expect, test } from '@jest/globals'
import { execSync } from 'child_process'
import { existsSync, rmSync } from 'fs'
import { resolve } from 'path'

describe('Usage with simple-monorepo', () => {
  const fixtureDir = '__fixtures__/simple-monorepo'
  const cwd = resolve(process.cwd(), fixtureDir)
  const cmd = `node ./dist/docker-deps.js ` + fixtureDir

  afterEach(() => {
    rmSync(resolve(cwd, '.docker-deps'), { recursive: true, force: true })
  })

  test('[API] Common synchronization usage', () => {
    dockerDepsSync({ cwd })

    expect.assertions(2)
    expect(existsSync(resolve(cwd, '.docker-deps/package.json'))).toBe(true)
    expect(existsSync(resolve(cwd, '.docker-deps/packages/subpackage-a/package.json'))).toBe(true)
  })

  test('[API] Common asynchronous usage', async () => {
    await dockerDeps({ cwd })

    expect.assertions(2)
    expect(existsSync(resolve(cwd, '.docker-deps/package.json'))).toBe(true)
    expect(existsSync(resolve(cwd, '.docker-deps/packages/subpackage-a/package.json'))).toBe(true)
  })

  test('[API] Use the "filter" option', () => {
    dockerDepsSync({ cwd, filter: '@simple-monorepo/subpackage-a' })

    expect.assertions(3)
    expect(existsSync(resolve(cwd, '.docker-deps/package.json'))).toBe(true)
    expect(existsSync(resolve(cwd, '.docker-deps/packages/subpackage-a/package.json'))).toBe(true)
    expect(existsSync(resolve(cwd, '.docker-deps/packages/subpackage-b/package.json'))).toBe(false)
  })

  test('[API] Invalid "filter" option', () => {
    try {
      dockerDepsSync({ cwd, filter: 'no-exist' })
    } catch (error) {
      expect((error as Error).message.startsWith('No monorepo subpackage named')).toBe(true)
    }
  })

  test('[CLI] Common usage', () => {
    execSync(cmd)

    expect.assertions(2)
    expect(existsSync(resolve(cwd, '.docker-deps/package.json'))).toBe(true)
    expect(existsSync(resolve(cwd, '.docker-deps/packages/subpackage-a/package.json'))).toBe(true)
  })

  test('[CLI] Use the "filter" option', () => {
    execSync(cmd + ' -f @simple-monorepo/subpackage-a')

    expect.assertions(3)
    expect(existsSync(resolve(cwd, '.docker-deps/package.json'))).toBe(true)
    expect(existsSync(resolve(cwd, '.docker-deps/packages/subpackage-a/package.json'))).toBe(true)
    expect(existsSync(resolve(cwd, '.docker-deps/packages/subpackage-b/package.json'))).toBe(false)
  })

  test('[CLI] Invalid "filter" option', () => {
    try {
      execSync(cmd + ' -f no-exist')
    } catch (error) {
      expect(error).toBeTruthy()
    }
  })
})
