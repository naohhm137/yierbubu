# 部署与 Blender 交接

项目：`C:/Users/29755/Documents/Codex/2026-09-14/w/work/live-yierbubu`

GitHub：https://github.com/naohhm137/yierbubu ，发布运行代码提交 `23ef824`（其前一提交 `2a0d8c8` 包含双父合并和主体重制）。

Render：https://yierbubu.onrender.com ，既有服务 ID `srv-dahajebl550s73e9cr6g`，Docker 服务，连接 main。健康路径 `/api/health`。

## 文件

- `art/blender/*.blend`：16 个可编辑 Blender 文件，包含双熊装扮、茶会场景和封面；材质图片已打包。
- `art/blender/textures/*.png`：颗粒、粗糙度和织物等原始纹理。
- `apps/web/public/models/studio/*.glb`：14 个发布模型。
- `apps/web/public/studio/`：封面、肖像和场景预览。
- `tools/build_studio.py`、`build_tea_garden.py`、`build_garden_cover.py`、`export_web_assets.py`：Blender 生成与网页导出脚本。
- `docs/reviews/2026-10-08-acceptance.md`、`art/verification/2026-10-08/`：验收说明、截图和 JSON。

## 启动 / 部署

Node.js 20 或更新版本，在项目根目录执行：

```sh
npm install --workspaces --include-workspace-root
npm test
npm run build
npm run build:server
npm start
```

生产服务默认 3001；通过环境变量 PORT/HOST 设置托管平台端口。生产前端与 Socket.IO 使用页面同源。开发分别运行 `npm run dev:server` 与 `npm run dev`，Vite 将 Socket.IO 代理到 3001。

Render 使用仓库根目录 Dockerfile；`.dockerignore` 排除源美术/验收文件和本机 node_modules，发布 GLB/封面随 `apps/web/public` 进入前端构建。主分支更新后应核对线上健康接口、双熊/茶桌/封面 SHA-256，并实际进入练习局。

`tools/verify_release.mjs` 验证生产页面和真实同源 Socket.IO；默认目标是本地 3002，可用 VERIFY_BASE 设置公网目标。VERIFY_IP 可指定经证书正常校验的托管节点。VERIFY_HTTP_BRIDGE=1 时，浏览器资源请求通过 Node HTTPS 实际读取同一公网文件并转发；游戏 WebSocket 保持直连远程服务器。该模式解决检查环境的 HTTP 下载波动，不代表普通网络性能测试。

仓库中 `yier.blend1` 是旧备份；正式编辑文件为 `.blend`。具体限制见验收报告。
