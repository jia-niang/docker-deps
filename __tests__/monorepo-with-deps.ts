import { dockerDepsSync } from '../dist/index'
import { afterEach, describe, expect, test } from '@jest/globals'
import { execSync } from 'child_process'
import { existsSync, rmSync } from 'fs'
import { resolve } from 'path'

describe('Usage with monorepo-with-deps', () => {
  const fixtureDir = '__fixtures__/monorepo-with-deps'
  const cwd = resolve(process.cwd(), fixtureDir)
  const cmd = `node ./dist/docker-deps.js ` + fixtureDir

  afterEach(() => {
    rmSync(resolve(cwd, '.docker-deps'), { recursive: true, force: true })
  })

  test('[API] Package has deps and using "filter" option (app)', () => {
    dockerDepsSync({ cwd, filter: '@monorepo-with-deps/app-a' })

    expect.assertions(6)
    expect(existsSync(resolve(cwd, '.docker-deps/package.json'))).toBe(true)
    expect(existsSync(resolve(cwd, '.docker-deps/apps/app-a/package.json'))).toBe(true)
    expect(existsSync(resolve(cwd, '.docker-deps/apps/app-b/package.json'))).toBe(false)
    expect(existsSync(resolve(cwd, '.docker-deps/packages/subpackage-a/package.json'))).toBe(true)
    expect(existsSync(resolve(cwd, '.docker-deps/packages/subpackage-b/package.json'))).toBe(true)
    expect(existsSync(resolve(cwd, '.docker-deps/packages/subpackage-c/package.json'))).toBe(true)
  })

  test('[API] Package has deps and using "filter" option (subpackage)', () => {
    dockerDepsSync({ cwd, filter: '@monorepo-with-deps/subpackage-a' })

    expect.assertions(6)
    expect(existsSync(resolve(cwd, '.docker-deps/package.json'))).toBe(true)
    expect(existsSync(resolve(cwd, '.docker-deps/apps/app-a/package.json'))).toBe(false)
    expect(existsSync(resolve(cwd, '.docker-deps/apps/app-b/package.json'))).toBe(false)
    expect(existsSync(resolve(cwd, '.docker-deps/packages/subpackage-a/package.json'))).toBe(true)
    expect(existsSync(resolve(cwd, '.docker-deps/packages/subpackage-b/package.json'))).toBe(true)
    expect(existsSync(resolve(cwd, '.docker-deps/packages/subpackage-c/package.json'))).toBe(true)
  })

  test('[CLI] Package has deps and using "filter" option (app)', () => {
    execSync(cmd + ' -f @monorepo-with-deps/app-a')

    expect.assertions(6)
    expect(existsSync(resolve(cwd, '.docker-deps/package.json'))).toBe(true)
    expect(existsSync(resolve(cwd, '.docker-deps/apps/app-a/package.json'))).toBe(true)
    expect(existsSync(resolve(cwd, '.docker-deps/apps/app-b/package.json'))).toBe(false)
    expect(existsSync(resolve(cwd, '.docker-deps/packages/subpackage-a/package.json'))).toBe(true)
    expect(existsSync(resolve(cwd, '.docker-deps/packages/subpackage-b/package.json'))).toBe(true)
    expect(existsSync(resolve(cwd, '.docker-deps/packages/subpackage-c/package.json'))).toBe(true)
  })

  test('[CLI] Package has deps and using "filter" option (subpackage)', () => {
    execSync(cmd + ' -f @monorepo-with-deps/subpackage-a')

    expect.assertions(6)
    expect(existsSync(resolve(cwd, '.docker-deps/package.json'))).toBe(true)
    expect(existsSync(resolve(cwd, '.docker-deps/apps/app-a/package.json'))).toBe(false)
    expect(existsSync(resolve(cwd, '.docker-deps/apps/app-b/package.json'))).toBe(false)
    expect(existsSync(resolve(cwd, '.docker-deps/packages/subpackage-a/package.json'))).toBe(true)
    expect(existsSync(resolve(cwd, '.docker-deps/packages/subpackage-b/package.json'))).toBe(true)
    expect(existsSync(resolve(cwd, '.docker-deps/packages/subpackage-c/package.json'))).toBe(true)
  })
})
