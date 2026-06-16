import { parseCLI, startVitest } from 'vitest/node'

const args = process.argv.filter((argument) => argument !== '--run-as-node' && argument !== '--no-sandbox')
const cli = parseCLI(['vitest', ...args.slice(2)])
const ctx = await startVitest('test', cli.filter, cli.options)

const failedTests = ctx?.state.getCountOfFailedTests() ?? 0
const unhandledErrors = ctx?.state.getUnhandledErrors().length ?? 0

process.exit(failedTests > 0 || unhandledErrors > 0 ? 1 : 0)
