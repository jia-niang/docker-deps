import { afterEach, describe, expect, test } from '@jest/globals'
import { execSync } from 'child_process'
import { dockerDepsSync } from 'docker-deps'
import { existsSync, readdirSync, rmSync } from 'fs'
import { resolve } from 'path'

describe('Usage with full-repo', () => {
  const fixtureDir = '__fixtures__/full-repo'
  const cwd = resolve(process.cwd(), fixtureDir)
  const cmd = `node ./dist/docker-deps.js ` + fixtureDir

  afterEach(() => {
    rmSync(resolve(cwd, '.docker-deps'), { recursive: true, force: true })
  })

  test('[API] Test full files', () => {
    dockerDepsSync({ cwd })

    expect.assertions(2)
    expect(readdirSync(resolve(cwd, '.docker-deps')).length).toBe(
      readdirSync(cwd).filter(t => t !== '.docker-deps').length
    )
    expect(existsSync(resolve(cwd, '.docker-deps/package.json'))).toBe(true)
  })

  test('[CLI] Test full files', () => {
    execSync(cmd)

    expect.assertions(2)
    expect(readdirSync(resolve(cwd, '.docker-deps')).length).toBe(
      readdirSync(cwd).filter(t => t !== '.docker-deps').length
    )
    expect(existsSync(resolve(cwd, '.docker-deps/package.json'))).toBe(true)
  })
})
