import { dockerDepsSync } from './index'
import { Command } from 'commander'

const program = new Command()

program
  .name('docker-deps')
  .description(
    `Extract the minimal dependency definition files needed to build Docker image, also compatible with monorepo.\nNotice: this library will only copy files to the output directory according to the rules, it will never modify the content of any files.`
  )
  .argument(
    `[cwd]`,
    `optional specify the working directory, usually the directory of the Dockerfile, other directory options are based on this`
  )
  .option(`-o, --output <dir>`, `specify the output directory, default ".docker-deps"`)
  .option(
    `-f, --filter <name>`,
    `available in monorepo, provide a package name to extract only this package and its dependencies, similar to the "-F" parameter of "turbo prune".`
  )
  .option(`-d, --dry-run`, `only print actions to the console without actually executing them`)
  .option(`-q, --quiet`, `disable most console output`)
  .option(`--include <patterns...>`, `specify files to be copied additionally, using glob pattern, separated by spaces`)
  .option(
    `--exclude <patterns...>`,
    `exclude specific files when copying, using glob pattern, separated by spaces, higher priority than include`
  )

program.parse(process.argv)

const options = { ...program.opts(), cwd: program.args[0] }
dockerDepsSync(options)
