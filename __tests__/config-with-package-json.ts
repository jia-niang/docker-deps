import { afterEach, describe, expect, test } from '@jest/globals'
import { execSync } from 'child_process'
import { dockerDepsSync } from 'docker-deps'
import { existsSync, rmSync } from 'fs'
import { resolve } from 'path'

describe('Usage with config-with-package-json', () => {
  const fixtureDir = '__fixtures__/config-with-package-json'
  const cwd = resolve(process.cwd(), fixtureDir)
  const cmd = `node ./dist/docker-deps.js ` + fixtureDir

  afterEach(() => {
    rmSync(resolve(cwd, '.docker-deps'), { recursive: true, force: true })
    rmSync(resolve(cwd, '.customize-output'), { recursive: true, force: true })
  })

  test('[API] Test configuration in package.json', () => {
    const result = dockerDepsSync({ cwd })

    expect.assertions(5)
    expect(result.configFromPackageJson).toBeTruthy()
    expect(existsSync(resolve(cwd, '.docker-deps/package.json'))).toBe(false)
    expect(existsSync(resolve(cwd, '.customize-output/package.json'))).toBe(true)
    expect(existsSync(resolve(cwd, '.customize-output/.npmrc'))).toBe(false)
    expect(existsSync(resolve(cwd, '.customize-output/include.js'))).toBe(true)
  })

  test('[API] Test override package.json configuration', () => {
    const result = dockerDepsSync({ cwd, include: [] })

    expect.assertions(3)
    expect(result.configFromPackageJson).toBeTruthy()
    expect(existsSync(resolve(cwd, '.customize-output/package.json'))).toBe(true)
    expect(existsSync(resolve(cwd, '.customize-output/include.js'))).toBe(false)
  })

  test('[CLI] Test configuration in package.json', () => {
    execSync(cmd)

    expect.assertions(4)
    expect(existsSync(resolve(cwd, '.docker-deps/package.json'))).toBe(false)
    expect(existsSync(resolve(cwd, '.customize-output/package.json'))).toBe(true)
    expect(existsSync(resolve(cwd, '.customize-output/.npmrc'))).toBe(false)
    expect(existsSync(resolve(cwd, '.customize-output/include.js'))).toBe(true)
  })

  test('[CLI] Test override package.json configuration', () => {
    execSync(cmd + ' --include noop')

    expect.assertions(2)
    expect(existsSync(resolve(cwd, '.customize-output/package.json'))).toBe(true)
    expect(existsSync(resolve(cwd, '.customize-output/include.js'))).toBe(false)
  })
})
