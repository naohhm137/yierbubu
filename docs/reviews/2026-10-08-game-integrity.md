# Game integrity verification — 2026-10-08

Scope: shared engine, RoomManager, socket management forwarding, root test command. No commits or deployment performed by this worker.

## Root causes and fixes

- peekHand hid its secret only from the target; yier insight hid target hand information only from the target and deck information from the caster. Secret entries now exclude every other seated viewer, and regression tests check caster, target, and two bystanders.
- leaveRoom removed live players, destroying their hands and leaving the active ID dangling. During games, the departing seat retains its state and becomes a bot. The actual existing 1.2–2 second bot timer advances its turn. Host transfers to an online human. Rooms without humans are cleaned up, including bot-only lobbies.
- fillBots/removeBot/restart had no server authorization. All require an explicit requester matching the room host; socket handlers supply socket.id. Restart also requires at least four seats. Bot counts reject non-integers and values outside 1–8.
- Socket character selection bypassed validation, and createGame dereferenced unknown character metadata. Selection now checks known and unoccupied characters in the lobby; creation safely assigns distinct known alternatives for invalid or duplicate choices.
- Explicit nonexistent action targets previously consumed cards or skills. They now fail before any state mutation.

## Red/green evidence

Runtime PATH prefix: `C:/Users/29755/Documents/Codex/2026-09-14/w/work/runtime/node-v22.19.0-win-x64`.

Initial command: `./node_modules/.bin/tsx.cmd --test packages/shared/src/engine.test.ts apps/server/src/RoomManager.test.ts`.

Before fixes: 22 tests, 15 pass / 7 fail. Failures showed unauthorized mutations, missing selection validation API, removal of a live seat (3 instead of 4), secrets visible to others, and unknown character dereference. The missing API and dereference were expected reproductions of absent validation, rather than fixture/import failures.

Additional red: `./node_modules/.bin/tsx.cmd --test --test-name-pattern '不存在|100 个' packages/shared/src/engine.test.ts` gave 1 pass / 1 fail: nonexistent target returned true. After the target check it passed.

Additional red: `./node_modules/.bin/tsx.cmd --test apps/server/src/RoomManager.test.ts` gave 4 pass / 1 fail: a bot-only lobby remained after the last human left. After cleanup it passed.

Final `npm test`: **24 pass, 0 fail**, including the real departure timer (about 2.1 seconds). Final `npm run build:server`: TypeScript compile exit 0. `git diff --check`: exit 0; Git emitted its configured LF-to-CRLF advisory, no whitespace defects.

## Deterministic complete simulations

The committed test runs 4–8 players with seeds 1–100: **500 complete games**. Character rotation covers all twelve characters. Before every bot turn and after final settlement it asserts deck + discard + all hands contain exactly 72 cards with 72 distinct IDs. Each turn checks vitality within 0..maxVitality and friendship within 0..6; every game must have an active player while playing, finish with winner data, and remain within maxRounds. The simulation terminates after at most playerCount × maxRounds + 1 attempts, so an infinite/stalled game fails the test. All passed.

Existing victory behavior agrees with the visible RulesPage: progress ≥ 4 ends immediately, otherwise settlement occurs after round 8; guardian success also requires a living guide. No evidence warranted changing that behavior.

## Initial review findings (superseded by the follow-up below)

- `handLimit` is exposed metadata but the engine does not enforce an end-turn discard limit. This predates this task; resource assertions here cover vitality/friendship and card conservation, not hand caps.
- Socket handlers still assume well-formed object packets (for example joinRoom calls toUpperCase directly). Malformed packet shape handling was not repaired here.
- A socket can create/join another lobby while already assigned to one; currentRoomId tracks only the latest room, so the earlier seat can remain registered. Existing browser flows should be inspected for that path before claiming full lifecycle hardening.
- Skills with optional costs/targets can consume their once-per-turn use even when the effect cannot apply. This task only rejects explicitly nonexistent targets; exhaustive legality of all card/skill target modes is not established.
- RNG is module-global: interleaved rooms share random consumption, while all game resources/turn data are stored on their own RoomState. These sequential seeded tests establish deterministic isolated simulations, not per-room independent random streams.
- Unit tests use an actual Socket.IO Server and RoomManager; they do not establish real browser delivery or reconnect behavior. Independent review and browser/socket integration remain controller responsibilities.

## Follow-up after independent review

The controller requested completion of the above lifecycle, legality, hand-cap and RNG findings. Socket events now enter a testable `SocketSession` used by index.ts; no listener/port side effects occur when importing the protocol module.

- Every payload-bearing event validates object shape and required field types. Undefined create/action packets, join `{}` and numeric room IDs, malformed action params, and count 0 return socket errors without throwing. Management refusals also return a visible error.
- Successful create/join releases the old RoomManager seat and socket room membership, and broadcasts the old room. An unsuccessful join leaves both old seat and membership intact. Moving out of an active game uses its existing bot takeover.
- Skill costs, required active targets, required hands, cloud-mail self-targets and empty detective information are validated before setting usedSkillThisTurn/hasActedThisTurn or consuming the star-stage free skill opportunity. Duplicate uses leave state unchanged.
- All twelve skill success paths are now checked with concrete resource effects. Qiaoqiao's active shield is separate from its passive immunity: the first unshielded damage is immune and draws one card; the next damage applies normally. A direct regression verifies its once-game passive flag.
- Tuantuan previously only logged a promise. It now arms the next targeted interaction card toward a chosen active player, consumes its redirect once, and leaves a refused card's redirect armed. A regression verifies both the redirected hit and the subsequent ordinary hit. Asong's fallback now actually reveals a random card name privately to the caster.
- On ending a turn, cards beyond the character's handLimit automatically return to discard, oldest acquired first. This is a deterministic fallback compatible with the existing socket protocol; a visible action log explains the count. The test confirms exact selected cards and 72-card conservation. Cards gained outside one's turn can remain above limit until that player's next turn ends.
- Each RoomState stores optional server-only rngState and skillRedirects. Random draws, card effects, skill effects, scene shuffles and AI choices use its own state. Another room's creation/actions no longer consume that room's stream. Interleaved-vs-isolated execution and JSON serialization/resumption produce identical state/log content (timestamps ignored). These fields are omitted from getPublicView.
- Skill result logs use the current shared character display name, allowing the controller's bear outfit naming without stale legacy character labels.

Follow-up red: running engine and protocol tests together before these fixes gave **19 pass / 6 fail** (malformed packet throw, old room seat remaining, count0 mutation, skill failure consuming state, excess hand retained, interleaved RNG mismatch). The initial missing protocol import was corrected by extracting the old behavior before obtaining those actual failing assertions. Later focused Tuantuan/Asong tests each failed before implementation. Serialization/resumption failed against WeakMap-only internal state and passed after storing RNG/redirect state on RoomState.

Final follow-up commands: **`npm test`: 35 pass / 0 fail**; **`npm run build:server`: exit 0**; scoped **`git diff --check`: exit 0**, only the configured CRLF advisory. The 500 complete simulations run again within this suite after the new legality, hand-limit and RNG behavior.

Remaining verification limits: real browser/network delivery and reconnect are controller checks; exhaustive card-description parity was not within this task (some existing cards deliberately use simplified engine effects). Moon-magician hides play/skill announcement entries, while resource changes remain visible; UI descriptions must state that narrower contract. No claim of error-free commercial behavior follows from these regressions.

## Third pass: action budget and card target legality

Presentation review identified that hasActedThisTurn was recorded but never enforced. The shared entry point now refuses a second main action of any of these six kinds: playCard, useSkill, gift, exchange, defend, hoard. Drawing remains optional once before or after the main action; dreamHelp and endTurn remain outside that budget. startRound resets the main budget, and normal endTurn still marks the seat completed for round scheduling.

Cards with an effect targeting `other` or `any` require an explicit target before any cost, discard, RNG consumption, log or armed-redirection consumption. `other` rejects the actor; `any` may select the actor. Such targets must be active, except revive requires a dream player and restores it to active normally. Tuantuan first validates the card's declared target, then its explicit redirect ability can move that valid play to any active player.

Red command: `./node_modules/.bin/tsx.cmd --test packages/shared/src/engine.test.ts`: **29 pass / 2 fail**, showing a second playCard accepted and a missing I01 target consumed the card. Minimal budget and target gates turned them green. Existing repeat-hit fixtures now advance through actual endTurn/round progression before playing again.

Final third-pass commands: **`npm test`: 39 pass / 0 fail**, including all twelve skill success paths, 500 complete seeded games, main-action pair rejection across all six types, optional drawing, next-round reset, dream help, invalid card targets, revival and valid `any` self-targets. **`npm run build:server`: exit 0**.

Additional observed pre-existing parity defect reported to the controller: mixed self/other card effects use a common target inside applyCardEffects (for example V05's self-damage is applied to the selected recipient). Exhaustive card effect parity remains a separate unresolved finding rather than being hidden by the new legality gate.

## Fourth pass: declared effect target routing

The controller authorized correcting mixed effect routing. applyCardEffects now selects the caster for each `self` effect and the chosen recipient for each `other`/`any` effect; existing `all` branches retain their group behavior. The draw branch also uses the effect's actual recipient, correcting F05's second draw. Supplying an extra targetId no longer redirects a self-only heal/shield/discard.

Focused red commands (`--test-name-pattern V05` and `--test-name-pattern 混合`) both failed before the fix: V05 left caster vitality unchanged, and G13 gave the caster no shield. After the minimal routing fix, **`npm test`: 41 pass / 0 fail**, including V05 actor entering dream and automatic turn continuation, G13 split shields, F01/F02/F03 split friendship, F05 one draw each, I16 self friendship, self-only V01/G01 unaffected by extra target, A09 self discard, 72-card conservation for each fixture, revival, all twelve skills and 500 complete seeded games. **`npm run build:server`: exit 0**.

### Previous card text/implementation gaps (resolved by the bounded redesign below)

These are existing contracts beyond effect routing; no claim of complete 72-card text parity has been made.

- I11, I22, I23, G05, G09, V06, A08, T04 and T06 fall through modifyScene to a descriptive log without the advertised redirection, hiding/reversal, cancellation, free-skill, scene switch or extra action. I24/T07/F08 do change wish progress as advertised.
- F06 heals zero rather than consuming friendship to heal; A07/G12 heal zero instead of removing a negative status (G12 still gives friendship).
- I02/I17/A03 all shuffle rather than swapping specified seats, gaining first position or choosing a position. I15/G07 choose a room-wide random banned card category instead of a personal next-turn restriction.
- I05/A02 draw a card instead of copying; I07 chooses help/damage randomly instead of accepting a choice; I09 applies damage and friendship unconditionally rather than branching on friendship; I12 remains private; I14 reveals only the target's hand to the caster. I18 boosts only the recipient; I19 lacks its mutual discard.
- G02/G03/T05 are ordinary shields instead of effect-specific immunities; G04's primitive transferNegative hurts its self target instead of installing damage interception; G10 immediately draws/gains friendship rather than weakening a future effect; G11 heals/draws immediately instead of installing one-time lifesaving. G13 shields do not expire; G14 currently gives its shield only to the chosen recipient.
- V07 lacks next-turn draw skipping; V08 lacks its printed two-friendship cost. A01 draws one without top-three selection; A06 swaps caster/target rather than transferring from one player to a third; A09 recycles the latest discard (including itself) and randomly discards rather than selecting a non-adventure card; A10 views a random self hand card rather than deck-top-six.
- T03 draws instead of duplicating; T04's scene-switch core effect is absent; T02's toy-rampage turn-delay only logs. T08 boosts the recipient rather than both players. F01 lacks its printed hand-card gift; F05 gives target friendship and one draw each rather than reconciling friendship differences; F07 draws only for the caster, not bonded partners.

These gaps were reported to the controller for a bounded decision on implementing effects or aligning the card definitions/copy to meaningful existing-protocol effects. No unrelated asset/UI files were changed by this worker.

## Fifth pass: bounded complete card redesign

The controller authorized cards.ts and narrow scenes.ts copy changes. The 72 card IDs and category counts remain intact. Cards now promise the concrete immediate mechanics implemented by the existing protocol; printed hints are updated together with descriptions. All previous no-op modifyScene/heal0 definitions have meaningful effects. Each card requires one main action; T06 no longer promises an unimplemented action-budget exception.

| IDs | Previous promise/problem → playable contract |
| --- | --- |
| I02 / I17 / A03 | Generic shuffle → target seat swap / actor moved first / actor moved last; completed turns never repeat. |
| I04 / A06 | User choice or three-person transfer → random exchange between actor and chosen target. |
| I05 / A01 | Copy skill or top-three choice → actor draws one. |
| I06 | Chosen category → one random category banned until round end. |
| I07 | Secret chosen help/harm → public random help or damage. |
| I08 | Transfer unspecified negative state → target takes one damage, actor heals one. |
| I09 | Unsupported conditional friendship test → actor loses one friendship, target gains two. |
| I11 | Interrupt old play → arm a one-shot redirection of the next targeted interaction to the chosen active player. |
| I12 / I14 | Incorrect private-only behavior → public one-card reveal / mutual one-card private peek. |
| I13 | Target choice between discard/damage → both random discard and damage. |
| I15 | Future skill lock → target friendship -1 and actor shield +1. |
| I16 / I18 / I19 | Missing participant effects → split damage/friendship; both friendship; both random discard then random damage. |
| I20 / I21 / F04 | Unspecified temporary bonds → persistent bidirectional bond or removal of actor/target bond. |
| I22 / I23 | Logged conceal/reversal with no effect → real announcement concealment for not-yet-acted target / target friendship -2. |
| G02 / G03 / T05 | Unimplemented special immunity → ordinary shield. |
| G04 | Self damage masquerading as interception → target shield +1, actor friendship +1. |
| G05 / G09 | No-op cancellations → all active players shield+draw / actor shield+draw. |
| G06 / G08 / G10 / G11 | Unimplemented future triggers → immediate draw / active-group shield / draw+friendship / heal+draw. |
| G07 | Unimplemented future restriction → heal two, lose one friendship. |
| G12 / A07 | heal0 no-op → target heal+friendship / target heal+shield. |
| G13 / G14 | Expiry missing, one-sided shield → persistent split shield; bond plus split shield. |
| V05 / V07 / V08 | Misrouted damage, absent draw skip/cost → actor self-damage + target heal / target heal / enforced two-friendship healing cost. |
| V06 / A08 | No-op free skill/scene skip → actor friendship+2 / actor shield2+draw1. |
| A02 / A10 | Unsupported copied action/top-six choice → actor+target draw / public deck-top-two discard. |
| A05 / A09 | Self recycling or ignored selection → latest other discard; latest non-adventure discard, each with draw fallback (A09 then random self discard). |
| T02 / T05 | Logged toy turn delay → actual immediate actor move to order end on its 25% shield-side-effect roll. |
| T03 / T04 / T06 | Duplication, no-op scene/action powers → draw2 / actual different scene switch / draw2+heal1. T04 changes ongoing rules without replaying round-start events. |
| T07 / T08 | Imprecise risk / missing actor friendship → progress+1 with toy-only risk / both friendship+2 with per-effect toy risk. |
| F01 / F05 / F06 / F07 | Missing gift, reconciliation, zero healing, missing bonds → random remaining-card gift + both friendship / target friendship + one draw each / spend all friendship to heal / actor+active bonded partners draw. |

Scenes now state their actual scope: maze shuffles at round start, gift exchange selects random cards, toy boosts only damage/shield and rolls separately per applicable effect, quiet afternoon modifies card damage/heal only, cloud target history crosses rounds. Concealment refuses a target who already completed the round's main action. Wish-meteor now checks positive other/all effects, so a self-only card with a gratuitous targetId cannot falsely repair the wish star; a failing regression demonstrated and fixed that exploit.

Red evidence: **29 focused redesigned-card cases failed 29/29** against old behavior (`node --import tsx --test --test-name-pattern=重制 ...`); seat-order and public/mutual peek tests also failed before implementation. Target-routing tests from prior pass continued to protect V05 and mixed effects. One fixture expected A10 discard count2 while omitting the played A10 itself; corrected the expected total to3 after confirming the two revealed cards and played card all belong in discard. Initial broad runs hung while Node's failed assert.ok source-extraction processed the large table fixture; they were stopped by their exact test PIDs, and switching failing predicates to assert.equal yielded actual red assertion output without changing the expected behavior.

Final commands: **`npm test`: 75 pass / 0 fail**, **`npm run build:server`: exit0**. This includes focused concrete resource assertions for29 changed cards, all72 cards playable with valid targets/resources and72 unique cards preserved, required-cost/target rejections without mutations, public/private visibility, all12 skills, and500 complete games with strict max-round termination. Scoped whitespace check passes (only configured LF/CRLF advisory).

Remaining limits are product balance and real browser/network integration, rather than the previously listed nonexistent future card mechanics. Immediate effects may clamp at resource limits, bond/peek/swap effects may have no eligible data at the time of play, and A10 intentionally shows up to the remaining deck count without reshuffling. Duplicate simple shield/draw cards remain in the deck; the redesign preserves IDs/categories and prioritizes truthful playable rules over inventing72 complex mechanics.

## Sixth pass: independent re-review P2 regressions

Read `2026-10-08-integrity-rereview.md` and reproduced all three findings before edits. Focused commands using `node --import tsx --test --test-name-pattern=终局共享 ...` and `--test-name-pattern=待触发 ...` produced **3 failing assertions**: a finished public recap included a private peek; I05's gratuitous target consumed an armed redirect; redirected I22 concealed an already-acted recipient and returned success.

Settlement keyEvents now uses only entries without any hiddenFor recipients. The caster retains their private messages in their own actionLog; the shared recap never republishes them. Redirection now requires a declared `other`/`any` effect, so self-only interaction cards ignore gratuitous targets for redirection consumption. I22 checks the effective recipient after redirection resolution, before any mutation; a refused redirected I22 keeps its card, main-action allowance, RNG/log state and pending redirect intact.

Final commands: **`npm test`: 78 pass / 0 fail**, retaining all72-card fixtures, all12 skills and500 complete-game simulations. **`npm run build:server`: exit0**; scoped whitespace check exit0 (Git CRLF advisory only). No unrelated scope expansion.
