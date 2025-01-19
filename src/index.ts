import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from 'fs'
import { GlobOptions, globSync } from 'glob'
import { dirname, join, resolve } from 'path'
import pc from 'picocolors'
import { PackageJson, sync as readPackageSync } from 'read-pkg'

export interface Config {
  /**
   * Specify the working directory, usually the directory of the Dockerfile,
   * other directory options are based on this.
   *
   * @default process.cwd()
   */
  cwd?: string

  /**
   * Specify the output directory.
   *
   * @default ".docker-deps"
   */
  output?: string

  /**
   * Available in monorepo.
   *
   * Provide a package name to extract only this package and its dependencies,
   * similar to the `-F` parameter of `turbo prune`.
   *
   * If not provided, all sub-packages will be extracted.
   */
  filter?: string

  /**
   * Disable most console output.
   *
   * @default false
   */
  quiet?: boolean

  /**
   * Only print actions to the console without actually executing them, ignore the `quiet` option.
   *
   * @default false
   */
  dryRun?: boolean

  /**
   * Specify files to be copied additionally, using glob pattern.
   */
  include?: string | string[]

  /**
   * Exclude specific files when copying, using glob pattern, higher priority than `include`.
   */
  exclude?: string | string[]

  /**
   * Passed through as a configuration option for `glob`.
   */
  configGlob?: GlobOptions
}

export interface CopyFile {
  from: string
  to: string
  fromAbs: string
  toAbs: string
}

export interface Result {
  copyFiles: CopyFile[]
  configFromPackageJson?: Partial<Config>
}

const commonFiles = ['package.json', '.npmrc']
const npmFiles = ['package-lock.json']
const yarnFiles = ['yarn.lock', '.yarnrc', '.yarnrc.yml']
const pnpmFiles = ['pnpm-lock.yaml', '.pnpmfile.cjs', 'pnpm-workspace.yaml']
const bunFiles = ['bun.lockb', 'bunfig.toml']

const allFiles = [...commonFiles, ...npmFiles, ...yarnFiles, ...pnpmFiles, ...bunFiles]
const allFilesPattern = `{${allFiles.join(',')}}`

const packageJsonConfigField = 'docker-deps'

interface PackageInfo {
  dir: string
  deps: string[]
}

export function dockerDepsSync(config?: Config): Result {
  const result: Result = { copyFiles: [] }

  const cwd = config?.cwd || process.cwd()

  const rootPackageJson = readPackageSync({ cwd })
  const packageJsonConfig = rootPackageJson[packageJsonConfigField] as Config
  if (packageJsonConfig) {
    result.configFromPackageJson = packageJsonConfig
  }

  const quiet = config?.quiet || packageJsonConfig?.quiet || false

  if (!quiet) {
    console.log(`📦 Docker-deps`)
  }
  if (packageJsonConfig && !quiet) {
    console.log(`🔑 Load config from the "${packageJsonConfigField}" field in package.json.`)
  }

  const output = config?.output || packageJsonConfig?.output || '.docker-deps'
  const filter = config?.filter || packageJsonConfig?.filter
  const dryRun = config?.dryRun || packageJsonConfig?.dryRun || false
  const include = config?.include || packageJsonConfig?.include || []
  const exclude = config?.exclude || packageJsonConfig?.exclude || []
  const configGlob = config?.configGlob

  if (quiet && dryRun) {
    console.warn(
      pc.bgYellow(`When the "dryRun" option is enabled, some outputs are not affected by the "quiet" option.`)
    )
  }

  if (filter && !rootPackageJson.workspaces) {
    throw new Error(
      `The "filter" option is provided, but the "workspaces" field was not found in package.json. Is this a monorepo?`
    )
  } else if (rootPackageJson.workspaces && !Array.isArray(rootPackageJson.workspaces)) {
    throw new Error(`The "workspaces" field in package.json only supports array format.`)
  }

  const workspacePatterns: string[] = []
  if (!filter && rootPackageJson.workspaces) {
    rootPackageJson.workspaces
      .map(workspaceDirName => join(workspaceDirName, allFilesPattern))
      .forEach(path => void workspacePatterns.push(path))
  } else if (filter && rootPackageJson.workspaces) {
    function extractInternalDeps(packageJson: PackageJson): string[] {
      const deps = new Set<string>()
      Object.entries({ ...packageJson.dependencies, ...packageJson.devDependencies }).forEach(
        ([pkgName, pkgVersion]) => {
          if (pkgVersion?.startsWith('workspace:')) {
            deps.add(pkgName)
          }
        }
      )

      return [...deps]
    }

    const workspaceInfos: Record<string, PackageInfo> = {}
    for (const workspaceDef of (rootPackageJson.workspaces as string[]) || []) {
      const workspaceDirName = workspaceDef.replace(/[/\\]\*/, '')
      const workspaceDirPath = resolve(cwd, workspaceDirName)
      const subPackageDirs = readdirSync(workspaceDirPath).filter(dir =>
        statSync(resolve(cwd, workspaceDirPath, dir)).isDirectory()
      )

      for (const subpackDir of subPackageDirs) {
        const packageJson = readPackageSync({ cwd: resolve(workspaceDirPath, subpackDir) })
        const deps = extractInternalDeps(packageJson)
        workspaceInfos[packageJson.name] = { dir: join(workspaceDirName, subpackDir), deps }
      }
    }

    if (!workspaceInfos[filter]) {
      throw new Error(`No monorepo subpackage named "${filter}".`)
    }

    const allPackages: Record<string, string> = {}
    function handleDeps(pkgName: string) {
      if (!allPackages[pkgName]) {
        const subPackageInfo = workspaceInfos[pkgName]
        allPackages[pkgName] = subPackageInfo.dir
        subPackageInfo.deps.forEach(handleDeps)
      }
    }

    handleDeps(filter)
    extractInternalDeps(rootPackageJson).forEach(handleDeps)

    Object.values(allPackages).forEach(path => void workspacePatterns.push(join(path, allFilesPattern)))
  }

  const includePatterns = Array.isArray(include) ? include : [include]
  const files = globSync([allFilesPattern, ...workspacePatterns, ...includePatterns], {
    ignore: exclude,
    windowsPathsNoEscape: true,
    cwd,
    ...configGlob,
  })

  const createdDir = {}
  function createDir(path: string) {
    if (createdDir[path]) {
      return
    }

    createdDir[path] = true
    if (dryRun) {
      console.log(`📁 CREATE ${pc.green(path)}`)
    } else {
      mkdirSync(outputPath, { recursive: true })
    }
  }

  const outputPath = join(cwd, output)
  if (dryRun) {
    console.log(`❌ DELETE ${pc.red(output)}`)
  } else {
    rmSync(outputPath, { recursive: true, force: true })
  }

  createDir(output)

  files.forEach(file => {
    const from = file
    const to = join(output, file)
    const fromAbs = join(cwd, file)
    const toAbs = join(outputPath, file)

    result.copyFiles.push({ from, to, fromAbs, toAbs })

    if (dryRun) {
      createDir(dirname(to))
      console.log(`📄 COPY ${pc.cyan(from)} ➡️ ${pc.yellow(to)}`)
    } else {
      mkdirSync(dirname(toAbs), { recursive: true })
      copyFileSync(fromAbs, toAbs)
    }
  })

  if (!quiet) {
    if (existsSync(resolve(cwd, '.dockerignore'))) {
      const dockerIgnore = readFileSync(resolve(cwd, '.dockerignore'), { encoding: 'utf-8' })
      if (dockerIgnore.includes(output)) {
        console.warn(
          pc.bgYellow(`The output directory "${output}" has been ignored by .dockerignore, please remove it.`)
        )
      }
    }

    console.log('✅ Done.')
  }

  return result
}

export function dockerDeps(config?: Config): Promise<Result> {
  return new Promise(resolve => void resolve(dockerDepsSync(config)))
}
