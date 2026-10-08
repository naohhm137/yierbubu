# Premium Finish Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development for independent implementation and review; the controller owns asset production and integration.

**Goal:** Rebuild credible double-bear materials and scenery and deliver a tested playable game.

**Architecture:** Keep shared engine and socket protocol stable. Author textured GLB assets in Blender, use consistent world-space surface heights in React Three Fiber, and test engine/server boundaries independently.

**Tech Stack:** Blender 4.2, Python asset generation, Three.js / React Three Fiber, Node 22, Socket.IO, TypeScript.

**Spec:** docs/superpowers/specs/2026-10-08-premium-finish.md

## Global Constraints

- Preserve existing character IDs and socket events.
- All twelve characters use white or brown bear mother shapes.
- Actual exported textures, not Blender-only procedural nodes.
- Table surface is 1.0225; interactive props remain above it.
- No force push, no discarded user changes, no credentials in logs.
- Keep incomplete verification visible; never claim perfection.

### Task 1: Game integrity

**Files:** packages/shared/src/engine.ts, engine.test.ts; apps/server/src/RoomManager.ts, RoomManager.test.ts, index.ts; package.json.

**Interfaces:** Keep playerAction/getPublicView and RoomManager methods; optional requester IDs may be added to management methods with socket handlers passing socket.id.

- [x] Add failing tests: peekHand and yier insight private to caster; active player departure preserves 72 unique cards and progresses; non-host cannot restart/change bots; unknown/duplicate character safely rejected or assigned; seeded bots finish complete games preserving all cards.
- [x] Run Node test runner via local tsx, capture expected failures.
- [x] Implement hiddenFor as all viewer IDs except caster; turn departing active humans into bots during playing; remove only in lobby; authorize management inside RoomManager; validate selection.
- [x] Run focused regressions and seeded simulations; server build.
- [x] Independent task review and resolve findings.

### Task 2: Authored asset pipeline

**Files:** tools/build_studio.py, tools/build_table_scene.py; art/blender; apps/web/public/models/studio; apps/web/public/studio.

**Interfaces:** Preserve GLB and portrait paths. Export idle/blink/celebrate clip names. Export consistent named materials for micrograin, cloth, wood and ceramic.

- [x] Compare local authorized reference images and current output, set rounder body/head silhouette.
- [x] Build repeatable normal/roughness images and connect image nodes for glTF export; limit texture size to 512 per tile and share reused tiles.
- [x] Rig and export mother bear animation, use outfit palettes based on two bears.
- [x] Make fully detailed tea table and circular scenery, export GLB and editable blend.
- [x] Render cover, portraits and angle sheets; reimport GLB and assert texture/animation/bounds contracts.

### Task 3: Web integration and presentation

**Files:** apps/web/src/components/three/{GameCanvas,StudioModel,CharacterPreview,CenterCards,TableScene}.tsx; shared characters; menu/codex/game CSS.

**Interfaces:** Central table-space constants; named animation clips used for active/dream states; self-contained environment reflection without remote CDN assets.

- [x] Fix height baseline and prevent background shell/floor casting shadows.
- [x] Add coherent local environment lighting, subtle shadows, texture anisotropy and animation playback with reduced motion.
- [x] Replace role appearance/copy with two-bear themes and align descriptions with engine behavior.
- [x] Make quick practice entry and clear action guidance; polished consistent cover/UI.
- [x] Build and run browser inspection at desktop/mobile; correct observed defects in one batch and confirm.

### Task 4: Delivery verification

- [x] Independent review of final diff and tests, record any unresolved findings.
- [x] Run combined tests, seeded simulations, GLB contract, web/server builds and whitespace checks.
- [x] Commit only approved files, publish using established GitHub/Render workflow if connectivity allows.
- [x] Verify deployed code markers, health, asset hashes and playable session; save dated acceptance report, including unavailable independent Render SHA and network/truthful scope limitations.
