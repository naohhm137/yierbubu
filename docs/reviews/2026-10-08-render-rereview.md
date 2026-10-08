# Independent render and UI re-review — 2026-10-08

Read-only review of the saved render/UI diff and current source, the premium-finish spec/plan, presentation acceptance report, new lighting/table-space/printed-face components, and authored asset scripts. Source was reviewed after the controller's preview-fallback, printed-text, and main-action/target-eligibility amendments. No implementation changes or reported test reruns. Actual asset contracts and browser rendering are accepted only as controller-reported evidence; final multiplayer screenshots and deployment remain controller-owned.

## Verdict and implementation integrity

Request changes for three concrete P2 defects below. A fourth P2 accessibility gap is present in the existing game stylesheet and remains relevant to the current acceptance scope. No P0/P1 defect established in the reviewed source. The authored asset pipeline, shared table coordinates, local reflection lighting, and per-instance skeletal cloning form a coherent implementation rather than disconnected presentation placeholders.

## Actionable findings

### P2 — Readiness loading bypasses individual character fallbacks

Location: `apps/web/src/components/three/GameCanvas.tsx:32`–34 and 253. Category: implementation integrity/error recovery.

`SceneReady` calls `useGLTF` with every character URL outside the individual character error boundaries. If one character GLB returns 404 or fails decoding, this array load rejects into the outer `GameTable3D` error boundary. The corresponding `Character3D.tsx:39`–43 fallback therefore cannot preserve a playable scene even though it would handle the same character's own model failure. The whole canvas is replaced by the refresh error screen. Protect readiness probes at the same per-asset boundary as the models, or derive readiness from each model's resolved/fallback lifecycle without an unprotected duplicate load. A missing-character response should leave the other characters and game controls usable. Suggested command: `$impeccable harden`.

### P2 — Targeted skills cannot select the caster despite their contracts

Location: `apps/web/src/components/GameTable3D.tsx:132`–137. Category: implementation integrity/game interaction.

`permitsSelf` is derived only from `pendingCard.effects`. When the pending action is `useSkill`, `pendingCard` is null, so every targeted skill removes the caster from both the DOM name buttons and 3D target highlights. `candy_chef` and `windup_knight` have “任意一名玩家” targets and the engine permits healing/shielding oneself (`packages/shared/src/engine.ts:570`–572 and their `applySkill` cases). A player cannot use these valid defensive options through this UI; this is especially visible when every other player is dreaming. Derive eligibility from the skill's actual contract as well as card effects, preserving the other-player-only rule for `cloud_mail`. Suggested command: `$impeccable harden`.

### P2 — New gameplay copy is assigned to an unused property

Location: `packages/shared/src/characters.ts:388`. Category: implementation integrity/copy accuracy.

The mapped characters set `playstyle`, while `Character` defines `playStyle` and `CharacterSelect.tsx:43`/`CodexPage.tsx:85` render that existing property. The intended replacement never appears, leaving old descriptions such as Yier predicting scenes/changing action order and Bubu absorbing negative effects/converting failures, which the delivered skills do not implement. Assign the accurate copy to `playStyle` (and avoid keeping unused `playstyle`/`abilities` properties). This directly affects character selection and contradicts the spec's requirement for Chinese descriptions matching actual effects. Suggested command: `$impeccable clarify`.

### P2 — Current scene rules are unavailable as readable or accessible text

Location: `apps/web/src/components/GameTable3D.css:895`; related `GameTable3D.tsx:347`–350 and `three/SceneCardDisplay.tsx:10`. Category: accessibility/usable rules. Existing stylesheet gap, not a new CSS regression in the saved diff.

The only DOM presentation of `scene.rule` is hidden with `display:none` at every viewport. The replacement scene card paints the rule into a canvas texture, which is absent from the accessibility tree and tiny in the allowed full-table camera. Mobile also hides the scene-name badge. Rules such as Cloud Rain's repeated-target restriction and Quiet Afternoon's damage/heal changes materially change valid decisions, yet keyboard/screen-reader users cannot inspect the current rule from the game controls. Add a keyboard-operable current-scene disclosure or a compact readable panel containing the current name and complete rule at desktop/mobile sizes. Relevant standard: WCAG 1.1.1 (text alternative for rendered canvas information). Suggested command: `$impeccable adapt`.

## Positive source findings

- `StudioModel` uses `SkeletonUtils.clone`, so each character gets its own skeleton. It measures world-space bounds after matrix updates, scales/translates a wrapper, and leaves the authored hierarchy available for animation binding. Cached GLTF geometry/materials are intentionally preserved with `dispose={null}`; mixer cleanup stops actions and uncaches the instance root.
- Idle/Blink and the one-shot Celebrate clip use the instance mixer; reduced motion stops clip playback. Game decorative particles and floating props are removed under reduced motion, and preview controls disable damping while keeping explicit keyboard/button navigation.
- `TABLE_SURFACE = 1.0225` matches the tea-garden author's felt top (`.995 + .055 / 2`). Current card/decor placements use the shared surface constants. The scene card has two printed faces, and printed textures are disposed on replacement/unmount.
- The inward-facing authored shell and floor are excluded from shadow casting; the shell uses an unlit material and does not receive shadows. The same local lighting component serves game and preview, without HDR/font CDN loading in the active printed-card path.
- The material pipeline creates embedded normal/roughness image tiles, and the checker verifies embedded images, textured UVs, rigs, and exact clip names. The editable masters and web exports remain separate assets.
- DOM hand cards and target-name buttons provide usable keyboard alternatives to direct 3D picking. Viewport zoom is enabled. Responsive camera changes, safe-area bottom padding, and portrait action buttons are explicit in source.

## Bounded audit evidence and limits

Impeccable detector ran once over GameTable3D source/CSS, CharacterPreview, GameCanvas, StudioModel, and PrintedFace. It reported two warnings: a quick-rule left accent border (`GameTable3D.css:1000`) and the small wish-progress width transition (`:149`). Neither establishes a release defect in context; no mechanical finding is promoted above the concrete issues above.

Provisional source-only health: accessibility 2/4, performance 3/4, responsive design 3/4, theming 3/4, implementation integrity 3/4 = **14/20**. This is not a measured contrast/device-performance score or browser acceptance claim. Actual full-game layout, touch gestures, fallback network responses, and final multiplayer execution require the controller's browser evidence. Reported asset/build/test checks were not rerun. No source edits, Git commits, or remote changes were made.

Recommended order: harden readiness and skill targets, clarify the character property, adapt the current-scene disclosure, then one bounded `$impeccable polish` confirmation pass.

## Scoped fix confirmation — final source pass

This appendix supersedes the request-changes verdict for the four findings above. **All four are addressed in current source; no unresolved finding remains from this scoped render/UI review.** No tests, detector, or browser runs were repeated during this confirmation, and no new review scope was introduced.

- **Readiness/fallback: addressed.** `GameCanvas.tsx:32`–34 no longer loads a character array. It waits for the table's committed subtree and a set of player IDs reported by individual figures (`:192`–196). `Character3D.tsx:24`–26 and 45–48 commits `FigureReady` within the successful model Suspense subtree or its error-boundary fallback. A failed character therefore resolves its own fallback without rejecting an unprotected aggregate loader; pending models do not report success prematurely.
- **Skill self-targets: addressed.** `GameTable3D.tsx:133`–134 now permits the caster for pending skills except `cloud_mail`, while retaining card-declared `any` targeting and active/dream/conceal eligibility. Both DOM buttons and 3D highlights consume the resulting IDs.
- **Gameplay copy property: addressed.** `characters.ts:388` uses the actual `playStyle` property read by selection/codex components. The unused `playstyle` and `abilities` assignments are removed, so the old base descriptions are overridden in the exported characters.
- **Current scene text: addressed.** `GameTable3D.tsx:269` presents the current scene name and complete rule inside the existing keyboard-operable quick-rules panel. It remains readable DOM text even though the decorative scene-tip panel stays hidden.

The related portrait framing amendment uses the larger `[0, 12, 16]` camera position, portrait OrbitControls distance limits of 16–26, `makeDefault`, and reduced-motion-aware damping (`GameCanvas.tsx:80`, 241–248). The controller reports a passing final web build and real desktop/mobile rendering with five GLB models over four angles, no browser errors, and verified action-budget disabled states. Those checks are controller-reported verification, not independently rerun evidence. Approval here is limited to the reviewed source and the concrete findings above; full-game/network/deployment acceptance remains with the controller's final report.
