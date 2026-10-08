# Independent integrity re-review — 2026-10-08

Reviewed the saved integrity diff, current shared engine/card/scene definitions, SocketSession and its tests, RoomManager and its tests, socket registration, updated verification report, premium-finish spec and plan. No implementation edits or test reruns. The reported 75 passing tests and 500 bounded games are accepted as reported evidence, not independently rerun evidence.

## Spec compliance

The earlier malformed-packet, stale joined-room seat, count-zero, failed-skill mutation, hand-cap and room-RNG findings are addressed by the amended code. Host authorization and departing-seat takeover remain intact. Main-action budget and declared effect routing are now enforced. The bounded redesign preserves the 72 card IDs and makes previously absent mechanics concrete or changes the printed contract to existing mechanics. Browser/network and reconnect acceptance remains outside this review.

Privacy acceptance still fails at settlement; two redirection edge cases also violate the amended card contracts.

## Actionable findings

### P2 — Settlement republishes private peek messages

`packages/shared/src/engine.ts:1135` copies the last ten raw log messages into `winnerData.keyEvents` without applying `hiddenFor`. `getPublicView` returns this same winnerData to every viewer at line 1250. Reproducer: in round 8, have Yier privately inspect a hand/deck top, then end the remaining turns while fewer than ten new logs are added. At final settlement every other player's public view contains those private card names in keyEvents, even though its actionLog correctly excludes the entries. The spec says secret peeks appear only to the actor and provides no settlement exception. Use only public entries in the shared recap, or derive a viewer-filtered recap, and cover finished public views in privacy regression tests.

### P2 — Extra target on a self-only interaction consumes an armed redirect

`packages/shared/src/engine.ts:501` activates redirection for any interaction with a supplied targetId, rather than only cards with declared player-targeted effects. Reproducer: arm I11/Tuantuan toward player C, then player B plays self-only I05 with a valid gratuitous targetId. The card still draws only for B, but lines 525–527 delete the armed redirect and claim it redirected the play. I11 promises the next interaction that targets a player; this consumes the ability on a play with no such effect. Gate redirection on the declared targeted effects, and test self-only interactions with extra targetId.

### P2 — I22 eligibility is checked before redirection changes its recipient

`packages/shared/src/engine.ts:496` rejects I22 only when its declared recipient already acted. Lines 501–506 can then replace that recipient with an already-acted active player; line 872 applies concealment to that replacement with no further eligibility check. Reproducer: C has completed its main action, A arms a redirect to C, B plays I22 at unacted D. It succeeds, consumes the card/redirect/main action, and hides C's announcement after C already acted. This violates I22's explicit requirement that its target has not completed a main action and produces an ineffective paid play. Validate card-specific recipient eligibility after resolving the redirect, before any mutation.

## Code quality and verdict

The extracted protocol module is testable without starting the listener, runtime shape checks cover the registered payload events, failed room joins retain the old seat, and successful switches release it. Persistent room-local RNG supports serialization, and the public view omits its state and armed redirects. The regression suite now covers substantially more behavior than the initial review.

Verdict: request changes for the three concrete P2 findings above before marking game-integrity acceptance complete. No P0/P1 finding established in this amended scope. The reported simulation evidence supports termination and conservation; it does not cover these finished-view privacy and redirected-card eligibility paths. Product balance and actual browser/network acceptance remain separate verification limits.

## Scoped fix confirmation — sixth pass

Re-read the current relevant engine methods, the three new regressions at engine.test.ts:476–505, the saved integrity-fix diff and sixth-pass evidence. This confirmation is restricted to the three findings above; no tests were rerun and no scope expansion was performed.

- Settlement at engine.ts:1135 now filters out every entry with hidden recipients before constructing the shared recap. The new regression reaches a finished game after a real private insight and checks every viewer's recap for both secrets. The private-settlement finding is resolved.
- Redirection at engine.ts:499 now requires declared other/any effects, so a gratuitous targetId on self-only I05 does not consume an armed redirect. The regression verifies the pending mapping remains intact. The self-only-redirection finding is resolved.
- I22 at engine.ts:508–509 now checks the final resolved recipient before costs, redirect deletion, logs or card/main-action mutation. The new regression redirects to an already-acted player, expects refusal, and compares the entire serialized state before/after. The redirected-I22 finding is resolved.

Updated verdict: approved for these three reviewed fixes; no remaining actionable finding in this scoped confirmation. The controller reports 78 passing tests including 500 complete simulations and a passing server build. Those reported results complement the logic review; actual browser/network acceptance remains a separate requirement of the overall spec.
