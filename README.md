# `docker-deps`

[![Build Status](https://drone.paperplane.cc/api/badges/jia-niang/docker-deps/status.svg)](https://drone.paperplane.cc/jia-niang/docker-deps) [![npm](https://img.shields.io/npm/v/docker-deps)](https://www.npmjs.com/package/docker-deps) [![NPM Downloads](https://img.shields.io/npm/dm/docker-deps.svg?style=flat)](https://npmcharts.com/compare/docker-deps?minimal=true)

Read this in other languages: English | [简体中文](https://github.com/jia-niang/docker-deps/blob/main/README.zh-CN.md)

---

Extract only the essential files needed for the "install dependencies" step to optimize Docker image caching during builds, with full support for monorepos.

This project is inspired by [`turbo`](https://www.npmjs.com/package/turbo)'s [`turbo prune <subpackage> --docker`](https://turbo.build/repo/docs/reference/prune) command.

> This package is designed for process "building Docker images using a Dockerfile", and is typically executed within CI/CD pipelines.

Features:

- Provides both CLI and JS API usage, with the latter providing TypeScript type definitions and supporting both synchronous and asynchronous methods;
- Includes many configuration options, such as `dryRun`, and allows configuration in `package.json`;
- Automatically detects `.dockerignore` file configurations.

# CLI Usage

Run without installation:

```bash
npx docker-deps # using npm
yarn dlx docker-deps # using yarn
pnpm dlx docker-deps # using pnpm
```

(You may want to add the `-y` parameter to avoid interactive confirmation.)

After executing the command, a `.docker-deps` directory will be created in the root of the project, containing a minimal set of files necessary for the "install dependencies" step, such as `package.json`, `.npmrc`, `yarn.lock`, and others.

**Please configure the execution of this command within the CI/CD pipeline steps.**

Then, edit your `.gitignore` by appending the following line:

```
.docker-deps
```

> NOTE: **NEVER** add this line to `.dockerignore`.

Then, edit your `.gitignore`:

Before editing:

```Dockerfile
# ...

COPY . <WORKDIR>
RUN npm i
RUN npm build

# ...
```

After editing:

```Dockerfile
# ...

COPY .docker-deps <WORKDIR>
RUN npm i

COPY . <WORKDIR>
RUN npm build

# ...
```

The above code is used as an example, you can edit commands such as `npm build` as needed.

The edited `Dockerfile` will first extract the minimum set of files required to install dependencies, add it to the workspace, and then install the dependencies; after the dependency installation is completed, the source code will be copied to the workspace.

When this is done, as long as the project's dependencies have not changed until the `RUN npm i` step, they can be cached by Docker, eliminating the time and overhead of installing dependencies in multiple builds.

If it works and you commit the code when only modifying the source code without modifying the dependencies, when building the Docker image in CI/CD, the console output should be like this:

```
[stage-...] RUN npm i
CACHED
```

The "Install dependencies" step will be completed immediately and will not take time to download and install dependencies, which indicates that the Docker Builder cache is hit.

---

If the location where the command is executed is different from the project directory, you can specify the CWD location:

```bash
npx docker-deps path/to/project
```

---

CLI usage also supports various parameters. For example, you can use `-f` or `--filter` to filter specific monorepo subpackages, and you can use `-o` or `--output` to customize the output directory:

```bash
npx docker-deps -o other-output-dir -f @repo/web
```

This will only extract the configuration files of the root package, `@repo/web` and other sub-packages this package depends on, and make the output directory no longer `./.docker-deps` but `./other-output-dir `.

For more CLI configuration option, please refer to the "Configuration Reference" chapter.

# API Usage

Install this package:

```bash
npm add docker-deps # using npm
yarn add docker-deps # using yarn
pnpm add docker-deps # using pnpm
```

Called through JS/TS:

```javascript
import { dockerDeps, dockerDepsSync } from 'docker-deps'

// Asynchronous call
dockerDeps()

// Synchronous call
dockerDepsSync()
```

When called through JS, it runs in the directory where `process.cwd()` is located.  
The running directory can be customized through the `cwd` option:

```javascript
import { dockerDepsSync } from 'docker-deps'

dockerDepsSync({
  cwd: 'path/to/project',
})
```

For more API configuration option, please refer to the "Configuration Reference" chapter.

# Configuration Reference

Both API usage or CLI usage, this tool will read `package.json` located in the CWD directory and read the default configuration items from the `"docker-deps"` field, the format refers to "API Interface".

The configuration items in `package.json` have a lower priority, and the following configuration methods can override it.

---

In the following configuration, any relative directories that need to be provided are relative to CWD.

Options:

| CLI Option       | API Field    | Type          | Default          | Introduction                                                                                                                                                                                         |
| ---------------- | ------------ | ------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `-o` `--output`  | `output`     | `string`      | `".docker-deps"` | Specify output directory                                                                                                                                                                             |
| `-f` `--filter`  | `filter`     | `string`      | -                | Available in monorepo, provide a package name to extract only this package and its dependencies, similar to the `-F` parameter of `turbo prune`, if not provided, all sub-packages will be extracted |
| `-d` `--dry-run` | `dryRun`     | `boolean`     | `false`          | Only print actions to the console without actually executing them, ignore the `quiet` option                                                                                                         |
| `-q` `--quiet`   | `quiet`      | `boolean`     | `false`          | Disable most console output, but will not disable output in `dryRun` mode                                                                                                                            |
| `--include`      | `include`    | `string[]`    | -                | Specify files to be copied additionally, using glob pattern                                                                                                                                          |
| `--exclude`      | `exclude`    | `string[]`    | -                | Exclude specific files when copying, using glob pattern, separated by spaces, higher priority than include                                                                                           |
| -                | `configGlob` | `GlobOptions` | -                | Passed through as a configuration option for `glob`                                                                                                                                                  |

---

When called via API, the method has a return value, which has the following fields:

- `copyFiles`: List of files copied by the tool, in the format `Array<{ from: string; fromAbs: string; to: string; toAbs: string }>`;
- `configFromPackageJson`: Returned as this field if the configuration was read from `package.json`.
