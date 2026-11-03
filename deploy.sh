#!/usr/bin/env bash
#
# 一条命令完成 GitHub Pages 部署。
#
#   ./deploy.sh faweizhao26/nice-editor
#
# 前置条件：
#   1. 仓库已经在 GitHub 上建好了（空的、不要勾 README）；
#   2. 你的 SSH key 对该仓库有 push 权限（本机 SSH 身份是 faweizhao26）；
#   3. Pages 不用手动开：把构建产物推到 gh-pages 分支，GitHub 会自己把 Pages
#      打开（source = gh-pages）。实测新建仓库也生效，无需去 Settings 点。
#
set -euo pipefail

REPO="${1:-}"
if [[ -z "$REPO" ]]; then
  echo "用法: ./deploy.sh <owner>/<repo>   例: ./deploy.sh faweizhao26/nice-editor"
  exit 1
fi

NAME="${REPO##*/}"
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "▸ 仓库: $REPO   分支: $BRANCH   basePath: /$NAME"

# 1) 本地先按项目站点的方式构建一次，确认 basePath 下能跑
echo "▸ 本地校验构建（BASE_PATH=/${NAME}）…"
BASE_PATH="/$NAME" npm run build >/dev/null
echo "  ✓ 构建通过"

# 2) 配置 remote（已存在就更新）
if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "git@github.com:$REPO.git"
else
  git remote add origin "git@github.com:$REPO.git"
fi

# 3) 推送
echo "▸ 推送到 git@github.com:$REPO.git …"
git push -u origin "$BRANCH"

echo
echo "✓ 推送完成。GitHub Actions 会构建并推到 gh-pages 分支，进度见："
echo "  https://github.com/$REPO/actions"
echo
echo "发布后地址： https://${REPO%%/*}.github.io/$NAME/"
echo "（首次跑完大约 1～2 分钟）"
