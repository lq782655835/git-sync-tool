const path = require('path')
const { execSync } = require('child_process')
const pkgDir = require('pkg-dir')
const fsExtra = require('fs-extra')
const { branchMaps } = require('./constant')

// 项目目录
const pkgRoot = exports.pkgRoot = pkgDir.sync()
const pkg = exports.pkg = fsExtra.readJSONSync(path.join(pkgRoot, 'package.json'))

const getConfig = exports.getConfig = () => {
  if (!pkg['git-sync']) {
    throw new Error('[Error]: 需要在 package.json 添加 git-sync 配置')
    return
  }

  return pkg['git-sync'] || {}
}

exports.getBranch = () => {
  let branch = execSync(`git symbolic-ref -q --short HEAD`)
  let targetBranch = ''
  const { branchs: customBranchs = {} } = getConfig()
  const mergedBranchs = {
    ...branchMaps,
    ...customBranchs
  }

  if (Buffer.isBuffer(branch)) {
    branch = branch.toString().trim()
  }

  try {
    targetBranch = mergedBranchs[branch.toLowerCase()]
  } catch(e) {
    throw new Error('[Error]: 不存在目标分支', e)
  } finally {
    if (!targetBranch) {
      throw new Error('[Error]: 不存在目标分支')
    }
  }

  return targetBranch
}