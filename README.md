# git-sync-tool

将vue-cli项目打包后的静态文件，发布到指定egg项目下

## 安装

```
yarn add git-sync-tool -D
```

## 使用方式

```
// in package.json
"scripts": {
    "deploy-dev": "git-sync --branch=develop --dist ./docs/.vuepress/dist"
  },
"git-sync": {
    "target": "egg-project-url.git"
}
```

### 参数说明

`--branch`: 指定egg项目的目标分支

`--dist`: vue-cli项目的静态文件地址，相对路径，默认是'dist'

> 注意：egg项目需要ssh权限
