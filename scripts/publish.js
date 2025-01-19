const { execSync } = require('child_process')
const semver = require('semver')
const { sync: readPackageSync } = require('read-pkg')

const { name, version } = readPackageSync()

function getRegistryVersion() {
  try {
    const result = execSync(`npm view ${name} version`)
    const version = String(result).trim()

    return version
  } catch {
    return '0.0.0'
  }
}

const npmVersion = getRegistryVersion()
const shouldPublish = semver.gt(version, npmVersion)

console.log(`Current version: ${version}, and npm registry version: ${npmVersion}`)
console.log(shouldPublish ? `Ready for publish.` : `Skip publish.`)

if (shouldPublish) {
  execSync(`npm publish`)

  console.log(`Publish done.`)
}
