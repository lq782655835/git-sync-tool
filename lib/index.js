const fs = require('fs')
const fsExtra = require('fs-extra')
const path = require('path')
const { exec, execSync } = require('child_process')
const argv = require('yargs').argv

const { pkg, pkgRoot } = require('./util')

if (!pkg['git-sync']) {
  throw new Error('[Error]: 需要在 package.json 添加 git-sync 配置')
}

const { target } = pkg['git-sync']

if (!target) {
  throw new Error('[Error]: 在 package.json 下 git-sync 必须配置 target')
}

let targetUrl = target
const targetDist = argv.dist || 'dist' // 相对路径

let branch = ''
if (argv.b || argv.branch) {
  branch = argv.b || argv.branch
} else {
  const { getBranch } = require('./util')

  branch = getBranch()
}

const targetPkgName = getPkgName(targetUrl)
const targetPkgRootPath = path.join(pkgRoot, '..', targetPkgName)

if (fs.existsSync(targetPkgRootPath)) {
  fsExtra.removeSync(targetPkgRootPath)
}

function getPkgName(url) {
  const splitUrls = url.split('/')

  return splitUrls[splitUrls.length - 1].split('.')[0]
}

exec(`git clone ${targetUrl} --branch ${branch}`, {
  cwd: path.dirname(targetPkgRootPath)
}, (err, out) => {
  if (err) {
    console.log('[Error]: ' + err);
    return
  }

  if (!fs.existsSync(path.join(pkgRoot, targetDist))) {
    console.log('[Error]: 请先执行 npm run build 或者 直接运行 npm run deploy')
    return
  }

  const frontEndAssetsDir = path.join(targetPkgRootPath, 'app', 'public')
  const frontEndTemplatesDir = path.join(targetPkgRootPath, 'app', 'view')

  if (fs.existsSync(frontEndAssetsDir)) {
    fsExtra.removeSync(frontEndAssetsDir)
  } 

  if (fs.existsSync(frontEndTemplatesDir)) {
    fsExtra.removeSync(frontEndTemplatesDir)
  }

  fsExtra.moveSync(path.join(pkgRoot, targetDist), frontEndAssetsDir)
  fsExtra.moveSync(path.join(frontEndAssetsDir, 'index.html'), path.join(frontEndTemplatesDir, 'index.html'))

  const res = execSync('git status', {
    cwd: targetPkgRootPath
  })

  if (res.toString().indexOf('nothing to commit, working tree clean') !== -1) {
    throw new Error('[Error]: 你未修改代码,不能同步')
    return
  }

  exec('git add . && git commit -m "sync ' + getCommitMsg() + '"', {
    cwd: targetPkgRootPath
  }, (err2, out2) => {
    if (err2) {
      console.log('[Error]: ', err2)
      return
    }

    exec(`git push origin ${branch}`, {
      cwd: targetPkgRootPath
    }, (err3, out3) => {
      if (err3) {
        console.log('[Error]: ' + err3)
        return
      } else {
        console.log('sync success')
      }
    })
  })
})

function getCommitMsg() {
  const commitMsgPath = path.join(pkgRoot, '.git', 'COMMIT_EDITMSG')

  if (fs.existsSync(commitMsgPath)) {
    return fs.readFileSync(commitMsgPath)
  }

  return ''
}
