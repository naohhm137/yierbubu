# Presentation acceptance · 2026-10-08

Scope: MainMenu.tsx, MainMenu.css, RulesPage.tsx, and the entry/navigation portions of GameContext.tsx. No changes to 3D rendering, engine/server, or character definitions. Applied Impeccable polish and Emil design engineering guidance against the incumbent warm tea-table direction.

## Changes

| Before | After | Why |
| --- | --- | --- |
| Unicode icons and a generic version badge | Consistent authored stroke SVG icons, title and short tea-table invitation | Coherent controls and a clearer entry |
| Create/join only, name required to begin | Primary solo practice button; optional name becomes 茶会新朋友; secondary friend-room controls | New players can start a real five-seat session directly |
| No practice orchestration | Wait for roomCreated, confirm yier selection, fill four bots, confirm five players, start; 15-second timeout and server-error/disconnect recovery | Socket events follow confirmed server state and cannot run twice on rapid clicks |
| Hidden menu content inherited from old opacity animation | Explicit visible default, fixed local CSS specificity, readable 16px fields | Actual initial viewport renders the controls |
| Joining navigated before server confirmation | Navigate after a received roomState | Invalid room keeps the editable form available |
| Rules described unimplemented shared hands, combined actions and skills | Accurate action limits, overflow, bonds, current skills and win conditions; constants/card counts imported from shared data | Rules correspond to the delivered engine |
| Every playing broadcast displaced the rules page | Only phase changes navigate; rules and codex retain their reading state, and rules return follows room phase | Rules remain usable while other players act |

The practice sequence uses only the existing createRoom, selectCharacter, fillBots and startGame events. It waits for character assignment before filling bots, preserving yier for the human player. Phase changes preserve rule reading even if the room starts or finishes, so the return button uses the latest phase.

## Verification

- TypeScript: `node node_modules/typescript/bin/tsc --noEmit --project apps/web/tsconfig.json` passed after the final edits.
- Whitespace: focused `git diff --check` passed.
- Impeccable mechanical detector on MainMenu.tsx/MainMenu.css/RulesPage.tsx returned `[]`. One batched visual inspection and one confirmation pass; the first pass exposed the inherited transparent-menu defect, fixed before confirmation.
- Browser: Playwright with installed Microsoft Edge, real Vite at localhost:5173 and Socket.IO server at localhost:3001. Script: [2026-10-08-presentation-browser.mjs](2026-10-08-presentation-browser.mjs). All assertions passed; recorded evidence: [checks.json](presentation-2026-10-08/checks.json).
- Desktop 1440×1000, mobile 390×844, and narrow mobile 320×740 had no horizontal document overflow. Menu opacity was asserted to be 1; input computed font size was 16px.
- Rapid double click on solo practice emitted exactly createRoom → selectCharacter(yier) → fillBots(4) → startGame. The real server returned a playing room with one human as yier and four bots.
- Missing name validation focused the name field. A nonexistent room with a valid name returned a real server error while retaining the menu form. Enter on the name field created a normal room.
- Menu → rules → menu and lobby → rules → game paths passed. Real fillBots/startGame broadcasts did not dismiss the rules page, and return text changed from 返回大厅 to 返回对局.
- Twelve skill explanations were reachable through the rules disclosure.
- A real server rejection of deliberately invalid fillBots count returned practice to its created lobby. Suppressing the outgoing startGame packet and advancing the browser clock by 15 seconds exercised timeout recovery to the five-player lobby.
- No browser pageerror events occurred on the main desktop/mobile paths.

Screenshots: [desktop menu](presentation-2026-10-08/menu-desktop.png), [mobile menu](presentation-2026-10-08/menu-mobile.png), [mobile rules](presentation-2026-10-08/rules-mobile.png), [practice navigation](presentation-2026-10-08/practice-desktop.png).

## Integration boundary

The rules state one main action per turn, and the final engine source now contains the corresponding hasActedThisTurn guard. Game-table disabled states are owned by the controller. This report verifies entry and navigation, not final GLB readiness or a full eight-round match. The practice navigation screenshot may show loading while the separate asset/rendering integration is in progress. The root owns combined builds, final 3D browser acceptance, and engine/server tests. No commit was made.

