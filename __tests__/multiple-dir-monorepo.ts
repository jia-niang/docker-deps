import { dockerDepsSync } from '../dist/index'
import { afterEach, describe, expect, test } from '@jest/globals'
import { execSync } from 'child_process'
import { existsSync, rmSync } from 'fs'
import { resolve } from 'path'

describe('Usage with multiple-dir-monorepo', () => {
  const fixtureDir = '__fixtures__/multiple-dir-monorepo'
  const cwd = resolve(process.cwd(), fixtureDir)
  const cmd = `node ./dist/docker-deps.js ` + fixtureDir

  afterEach(() => {
    rmSync(resolve(cwd, '.docker-deps'), { recursive: true, force: true })
  })

  test('[API] Test multiple workspace directories monorepo', () => {
    dockerDepsSync({ cwd })

    expect.assertions(3)
    expect(existsSync(resolve(cwd, '.docker-deps/package.json'))).toBe(true)
    expect(existsSync(resolve(cwd, '.docker-deps/packages/subpackage-a/package.json'))).toBe(true)
    expect(existsSync(resolve(cwd, '.docker-deps/apps/app-b/package.json'))).toBe(true)
  })

  test('[API] Use the "filter" option', () => {
    dockerDepsSync({ cwd, filter: '@multiple-workspace-dir-monorepo/subpackage-a' })

    expect.assertions(5)
    expect(existsSync(resolve(cwd, '.docker-deps/package.json'))).toBe(true)
    expect(existsSync(resolve(cwd, '.docker-deps/packages/subpackage-a/package.json'))).toBe(true)
    expect(existsSync(resolve(cwd, '.docker-deps/packages/subpackage-b/package.json'))).toBe(false)
    expect(existsSync(resolve(cwd, '.docker-deps/apps/app-a/package.json'))).toBe(false)
    expect(existsSync(resolve(cwd, '.docker-deps/apps/app-b/package.json'))).toBe(false)
  })

  test('[CLI] Test multiple workspace directories monorepo', () => {
    execSync(cmd)

    expect.assertions(3)
    expect(existsSync(resolve(cwd, '.docker-deps/package.json'))).toBe(true)
    expect(existsSync(resolve(cwd, '.docker-deps/packages/subpackage-a/package.json'))).toBe(true)
    expect(existsSync(resolve(cwd, '.docker-deps/apps/app-b/package.json'))).toBe(true)
  })

  test('[CLI] Use the "filter" option', () => {
    execSync(cmd + ' -f @multiple-workspace-dir-monorepo/subpackage-a')

    expect.assertions(5)
    expect(existsSync(resolve(cwd, '.docker-deps/package.json'))).toBe(true)
    expect(existsSync(resolve(cwd, '.docker-deps/packages/subpackage-a/package.json'))).toBe(true)
    expect(existsSync(resolve(cwd, '.docker-deps/packages/subpackage-b/package.json'))).toBe(false)
    expect(existsSync(resolve(cwd, '.docker-deps/apps/app-a/package.json'))).toBe(false)
    expect(existsSync(resolve(cwd, '.docker-deps/apps/app-b/package.json'))).toBe(false)
  })
})
