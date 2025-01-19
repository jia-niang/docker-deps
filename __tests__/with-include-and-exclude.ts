import { dockerDepsSync } from '../dist/index'
import { afterEach, describe, expect, test } from '@jest/globals'
import { execSync } from 'child_process'
import { existsSync, rmSync } from 'fs'
import { resolve } from 'path'

describe('Usage with with-include-and-exclude', () => {
  const fixtureDir = '__fixtures__/with-include-and-exclude'
  const cwd = resolve(process.cwd(), fixtureDir)
  const cmd = `node ./dist/docker-deps.js ` + fixtureDir

  afterEach(() => {
    rmSync(resolve(cwd, '.docker-deps'), { recursive: true, force: true })
  })

  test('[API] Use the "include" option (string)', () => {
    dockerDepsSync({ cwd, include: 'include.js' })

    expect.assertions(2)
    expect(existsSync(resolve(cwd, '.docker-deps/include.js'))).toBe(true)
    expect(existsSync(resolve(cwd, '.docker-deps/include.js'))).toBe(true)
  })

  test('[API] Use the "include" option (array)', () => {
    dockerDepsSync({ cwd, include: ['include.js', '*.json'] })

    expect.assertions(2)
    expect(existsSync(resolve(cwd, '.docker-deps/include.js'))).toBe(true)
    expect(existsSync(resolve(cwd, '.docker-deps/test.json'))).toBe(true)
  })

  test('[API] Use the "exclude" option (string)', () => {
    dockerDepsSync({ cwd, exclude: '.npmrc' })

    expect.assertions(2)
    expect(existsSync(resolve(cwd, '.docker-deps/.npmrc'))).toBe(false)
    expect(existsSync(resolve(cwd, '.docker-deps/.yarnrc'))).toBe(true)
  })

  test('[API] Use the "exclude" option (array)', () => {
    dockerDepsSync({ cwd, exclude: ['.npmrc', '.yarnrc'] })

    expect.assertions(2)
    expect(existsSync(resolve(cwd, '.docker-deps/.npmrc'))).toBe(false)
    expect(existsSync(resolve(cwd, '.docker-deps/.yarnrc'))).toBe(false)
  })

  test('[CLI] Use the "include" option (string)', () => {
    execSync(cmd + ' --include include.js')

    expect.assertions(2)
    expect(existsSync(resolve(cwd, '.docker-deps/include.js'))).toBe(true)
    expect(existsSync(resolve(cwd, '.docker-deps/include.js'))).toBe(true)
  })

  test('[CLI] Use the "include" option (array)', () => {
    execSync(cmd + ` --include include.js "*.json"`)

    expect.assertions(2)
    expect(existsSync(resolve(cwd, '.docker-deps/include.js'))).toBe(true)
    expect(existsSync(resolve(cwd, '.docker-deps/test.json'))).toBe(true)
  })

  test('[CLI] Use the "exclude" option (string)', () => {
    execSync(cmd + ' --exclude .npmrc')

    expect.assertions(2)
    expect(existsSync(resolve(cwd, '.docker-deps/.npmrc'))).toBe(false)
    expect(existsSync(resolve(cwd, '.docker-deps/.yarnrc'))).toBe(true)
  })

  test('[CLI] Use the "exclude" option (array)', () => {
    execSync(cmd + ' --exclude .npmrc .yarnrc')

    expect.assertions(2)
    expect(existsSync(resolve(cwd, '.docker-deps/.npmrc'))).toBe(false)
    expect(existsSync(resolve(cwd, '.docker-deps/.yarnrc'))).toBe(false)
  })
})
