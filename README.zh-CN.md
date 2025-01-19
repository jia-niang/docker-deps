# `docker-deps`

[![Build Status](https://drone.paperplane.cc/api/badges/jia-niang/docker-deps/status.svg)](https://drone.paperplane.cc/jia-niang/docker-deps) [![npm](https://img.shields.io/npm/v/docker-deps)](https://www.npmjs.com/package/docker-deps) [![NPM Downloads](https://img.shields.io/npm/dm/docker-deps.svg?style=flat)](https://npmcharts.com/compare/docker-deps?minimal=true)

只需一行指令，就能提取出 “安装依赖” 时所需的最小量的文件，使得构建 Docker 镜像时 “安装依赖” 这一步可以更容易地被缓存。对 monorepo 提供完全支持。

此项目受到 [`turbo`](https://www.npmjs.com/package/turbo) 的 [`turbo prune`](https://turbo.build/repo/docs/reference/prune) 命令的启发，实现了其带有 `--docker` 参数时的功能。

> 此包适用于 “使用 Dockerfile 构建 Docker 镜像” 的场景，通常运行在 CI/CD 步骤中。

特性：

- 提供 CLI 和 JS API 两种入口，后者还提供 TypeScript 类型定义，提供同步和异步方法；
- 有丰富的配置项，例如 `dryRun`，还可以在 `package.json` 中提供配置；
- 自动检测 `.dockerignore` 文件配置。

# CLI 用法

免安装运行：

```bash
npx docker-deps # 使用 npm
yarn dlx docker-deps # 使用 yarn
pnpm dlx docker-deps # 使用 pnpm
```

（可能需要添加 `-y` 参数来避免交互式确认）

执行命令后，会在项目根目录创建 `.docker-deps` 目录，其中会包含 “安装依赖” 步骤所需要的最小文件集合；  
例如 `package.json`、`.npmrc`、`yarn.lock` 等。

**请在 CI/CD 的步骤中配置执行这条命令。**

然后，修改你的 `.gitignore`，添加一行：

```
.docker-deps
```

> 注意，千万不要把这一行添加到 `.dockerignore`。

然后，修改你的 `Dockerfile`：

修改前：

```Dockerfile
# ...

COPY . <工作区目录>
RUN npm i
RUN npm build

# ...
```

修改后：

```Dockerfile
# ...

COPY .docker-deps <工作区目录>
RUN npm i

COPY . <工作区目录>
RUN npm build

# ...
```

以上代码作为示例，你可以根据需要调整 `npm build` 等命令。

修改后的 `Dockerfile` 会首先提取出安装依赖所需的最小文件集合，并把它添加到工作区，然后安装依赖；依赖安装完成后，再将源代码拷贝到工作区。  
当如此做后，只要项目的依赖项没有发生更改，直到 `RUN npm i` 这一步，都可以被 Docker 缓存，在多次构建中省略安装依赖所花费的时间和开销。

如果奏效，仅修改源码而没有修改依赖项时提交代码，在 CI/CD 中构建 Docker 镜像时，控制台输出应该是这样：

```
[stage-...] RUN npm i
CACHED
```

“安装依赖” 这一步会立刻完成，不会消耗时间下载安装依赖项，这表明命中了 Docker Builder 的缓存。

---

如果执行命令的位置和项目目录不同，可以指定 CWD 位置：

```bash
npx docker-deps path/to/project
```

---

CLI 用法也支持各种参数。例如，可以使用 `-f` 或 `--filter` 来筛选特定的 monorepo 子包，可以使用 `-o` 或 `--output` 来调整输出目录：

```bash
npx docker-deps -o other-output-dir -f @repo/web
```

这样只会提取根包、`@repo/web` 以及此包依赖的其它子包的配置文件，并使得输出目录不再是 `./.docker-deps` 而是 `./other-output-dir`。

有关更多 CLI 配置参数，请参考 “配置参考” 章节。

# API 用法

安装此包：

```bash
npm add docker-deps # 使用 npm
yarn add docker-deps # 使用 yarn
pnpm add docker-deps # 使用 pnpm
```

通过代码调用：

```javascript
import { dockerDeps, dockerDepsSync } from 'docker-deps'

// 异步调用
dockerDeps()

// 同步调用
dockerDepsSync()
```

通过 JS 调用时，运行在 `process.cwd()` 所在目录。  
可以通过配置项 `cwd` 来定制运行目录：

```javascript
import { dockerDepsSync } from 'docker-deps'

dockerDepsSync({
  cwd: 'path/to/project',
})
```

有关更多 API 配置参数，请参考 “配置参考” 章节。

# 配置参考

不论是 API 用法还是 CLI 用法，此工具都会读取位于 CWD 目录的 `package.json`，从其中的 `"docker-deps"` 字段中读取默认配置项，格式参考 “API 接口”；  
在 `package.json` 的配置项优先级较低，下文中的配置方式都可以覆盖它。

以下配置中，需要提供相对目录的，都是相对于 CWD 的。

配置参数：

| 命令行参数       | API 字段     | 类型          | 默认值           | 说明                                                                                                                                |
| ---------------- | ------------ | ------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `-o` `--output`  | `output`     | `string`      | `".docker-deps"` | 指定输出目录                                                                                                                        |
| `-f` `--filter`  | `filter`     | `string`      | -                | 适用于 monorepo，提供一个子包的包名（不是目录名），此时只会自动提取此包以及其依赖的包，适用于 monorepo 只需要构建其中某个子包的场景 |
| `-d` `--dry-run` | `dryRun`     | `boolean`     | `false`          | 只打印要执行的动作，而不会实际执行                                                                                                  |
| `-q` `--quiet`   | `quiet`      | `boolean`     | `false`          | 禁用大部分控制台输出，不会禁用 `dryRun` 模式的输出                                                                                  |
| `--include`      | `include`    | `string[]`    | -                | 提供 glob 目录名，这些文件也会一同被复制到输出目录，支持多个，用空格分隔                                                            |
| `--exclude`      | `exclude`    | `string[]`    | -                | 提供 glob 目录名，在复制时这些文件会被排除，优先级高于 `--include`，支持多个，用空格分隔                                            |
| 不适用           | `configGlob` | `GlobOptions` | -                | 此字段会透传给 `glob`                                                                                                               |

---

此外，以 API 方式调用时方法具有返回值，其具备以下字段：

- `copyFiles`：工具复制的文件列表，格式为 `Array<{ from: string; fromAbs: string; to: string; toAbs: string }>`；
- `configFromPackageJson`：如果从 `package.json` 中读取了配置，则作为此字段返回。
