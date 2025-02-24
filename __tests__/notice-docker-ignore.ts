import { afterEach, describe, expect, jest, test } from '@jest/globals'
import { dockerDepsSync } from 'docker-deps'
import { existsSync, rmSync } from 'fs'
import { resolve } from 'path'

describe('Test .dockerignore warning', () => {
  const fixtureDir = '__fixtures__/notice-docker-ignore'
  const cwd = resolve(process.cwd(), fixtureDir)

  afterEach(() => {
    rmSync(resolve(cwd, '.docker-deps'), { recursive: true, force: true })
    rmSync(resolve(cwd, '.customize-output'), { recursive: true, force: true })
  })

  test('[API] Test output path is not in .dockerignore', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => console.warn)

    dockerDepsSync({ cwd, output: '.customize-output' })

    expect.assertions(2)
    expect(warnSpy).not.toHaveBeenCalled()
    expect(existsSync(resolve(cwd, '.customize-output/package.json'))).toBe(true)

    warnSpy.mockRestore()
  })

  test('[API] Test output path in .dockerignore', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => console.warn)

    dockerDepsSync({ cwd })

    expect.assertions(2)
    expect(warnSpy).toHaveBeenCalled()
    expect(existsSync(resolve(cwd, '.docker-deps/package.json'))).toBe(true)

    warnSpy.mockRestore()
  })
})
