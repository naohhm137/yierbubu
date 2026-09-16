# 一二布布沉浸式重制实施计划

> For agentic workers: use subagent-driven-development or executing-plans to implement this plan task-by-task.

**Goal:** 将一二布布的角色、桌景、入口视觉和玩法模块升级为可发布的沉浸式联机卡牌游戏。

**Architecture:** Blender 作为角色与桌景的源资产，导出 GLB/WebP 供 React Three Fiber 按需加载；游戏逻辑继续由共享引擎和房间服务驱动，先用纯引擎模块与模拟测试验证新规则，再连接 UI。镜头采用中心目标与连续穹顶背景，UI 保留无 WebGL 和低端移动端回退。

**Tech Stack:** Blender 4.2, React, TypeScript, React Three Fiber, drei, Three.js, Vite, Node.js, Render Docker。

**Spec:** docs/superpowers/specs/2026-09-16-yierbubu-premium-rebuild-design.md

## Global Constraints
- 不直接复制未明确提供版权证明的第三方图片或模型，参考只用于造型方向。
- 保留房间、联机、机器人、角色选择和当前操作入口。
- 所有新 GLB 缺失或加载失败时必须回退到本地立绘/程序化模型。
- 375px 竖屏触控按钮最小高度 44px。
- 每个逻辑修改必须有共享引擎测试或机器人模拟覆盖。

---

### Task 1: Blender 资产管线与角色模型
**Files:** tools/build_studio.py; art/blender/*.blend; apps/web/public/models/studio/*.glb; apps/web/public/studio/portraits/*.webp; apps/web/public/studio/duo-cover.webp
- [ ] 用统一比例、圆润头身、贴面五官、软塑料/布料材质生成 12 个角色。
- [ ] 对一二、布布分别渲染正面棚拍图并检查耳朵、腮红、嘴型、脚底接触。
- [ ] 导出 GLB 并用 Blender 重新导入校验包完整、Y-up、原点贴地。
- [ ] 生成双人封面与 12 张立绘，确认文件体积适合网页加载。

### Task 2: 桌景与镜头不露墙
**Files:** tools/build_studio.py; apps/web/public/models/studio/table-scene.glb; apps/web/src/components/three/TableScene.tsx; apps/web/src/components/three/GameCanvas.tsx
- [ ] 在 Blender 中制作桌面、桌毡、桌脚、中心道具和连续圆形背景。
- [ ] 在 GameCanvas 中移除有限盒状背景，加载桌景 GLB 并保留交互层。
- [ ] 将 OrbitControls 目标和距离按桌面包围球配置，水平旋转 360°，垂直角度保持桌面可见。
- [ ] 在桌面端、375px 竖屏和 768px 平板验证任意旋转角度。

### Task 3: 入口、图鉴和模型回退
**Files:** apps/web/src/components/MainMenu.tsx; apps/web/src/components/MainMenu.css; apps/web/src/components/three/StudioModel.tsx; apps/web/src/components/three/Character3D.tsx; apps/web/src/components/CharacterPreview.tsx; apps/web/src/components/CodexPage.tsx
- [ ] 入口封面使用 duo-cover.webp，图片失败回退旧封面。
- [ ] 游戏角色优先加载 GLB，按 Box3 统一高度、贴地和中心，失败回退 Figurine。
- [ ] 图鉴预览提供旋转、缩放、复位和键盘操作，GLB 失败显示立绘。
- [ ] 角色详情在移动端可滚动，Escape 关闭，控制按钮有无障碍标签。

### Task 4: 玩法审计与可重复回合
**Files:** packages/shared/src/engine.ts; packages/shared/src/engine.test.ts; apps/server/src/RoomManager.ts; apps/web/src/components/GameTable3D.tsx
- [ ] 为当前回合状态、身份目标、心愿进度和机器人行动建立行为表。
- [ ] 先写失败测试覆盖事件变化、组合牌和隐藏目标结算。
- [ ] 实现最小可用模块，保证旧房间动作仍有明确结果。
- [ ] 用 4/5 机器人多轮模拟验证不会卡回合、死循环或越界。
- [ ] 将新状态接入 UI，并为玩家提供可读提示。

### Task 5: 发布验证
- [ ] 运行 npm test、npm run build --workspace apps/web、npm run build:server 和 git diff --check。
- [ ] 在本地验证入口、图鉴、创建房间、机器人回合和旋转镜头。
- [ ] 提交并推送 main，确认 Render 的目标提交为 Live。
- [ ] 请求公网首页、健康接口、封面、至少一个 GLB，记录 HTTP 200。
