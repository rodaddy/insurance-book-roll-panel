# Changelog

All notable changes to the Insurance Book-Roll Panel kit are recorded here. This
file follows Keep a Changelog and Semantic Versioning.

## [0.2.3] - 2026-08-17

Cross-family review (Opus + Terra) found the installed buyer path dead and a
green receipt recorded over a red suite. Both are fixed here.

### Fixed

- **The installed skill payload now runs on a buyer's machine.** The payload
  shipped seven ESM TypeScript scripts and no `package.json`, so once it was
  copied out of this repo — which is exactly what `INSTALL.md` tells the host
  agent to do — Node treated every `.ts` file as CommonJS and every documented
  command died with `SyntaxError: Cannot use import statement outside a module`.
  That killed the §4.9 refusal gate, both validators, the run preparer, and the
  install verifier. In-repo they only worked because the kit root's
  `package.json` happened to be an ancestor, and the kit root is not part of the
  copied payload. The payload now carries its own
  `skills/insurance-book-roll-panel/package.json` declaring `"type": "module"`,
  and a behavior test runs the refusal gate from a standalone copy.
- **A failed `room new` no longer strands a staging folder forever.** Any
  failure between staging and publish left
  `rooms/_staging/room-new-<name>-<pid>/` on disk with a partial template copy.
  `room list` filters `_staging` out so the buyer never saw it, and §8.2's
  archive-never-delete rule meant nothing would ever clear it — one invisible
  folder per failure, unbounded. Every failure path in that block now retires
  the partial copy into `rooms/_archive/<stamp>/` with a message saying so.
  Still one `mv`, never an `rm`.
- **The shipped test suite no longer hardcodes rTech's internal volume.**
  `tests/` ships inside the sellable package, and all three test files defaulted
  their scratch and archive roots to an absolute internal path.
  On any machine without that volume the suite errored in `beforeAll` instead of
  failing usefully, and it leaked rTech's temp-workspace layout into a buyer
  artifact. Both roots now live in `tests/harness.ts`, default to the operating
  system's temporary directory, and are overridable via
  `BOOK_ROLL_TEST_SCRATCH_ROOT` / `BOOK_ROLL_TEST_ARCHIVE_ROOT` (the legacy
  `RTECH_*` names still work) so rTech's own runs stay in the configured temp
  workspace.

### Added

- Behavior tests for the PRISTINE copied payload, which the 0.2.2 changelog
  claimed as a passing receipt without ever exercising it: source-side equality
  via `verify-copied-install.ts` and integrity via `scripts/verify-install.ts`,
  both run against an untouched copy BEFORE any buyer customization.
- A test asserting the failed-`room new` path leaves `_staging` empty and the
  partial copy archived. Proven red-first: reverting `stage_die` to the plain
  `die` it replaced fails that test.
- The version-truth test now covers the payload `package.json` version and its
  `"type": "module"` declaration, and the receipt assertions read `VERSION`
  instead of hardcoding a version string.

### Corrected

- **0.2.2's `### Verified` block claimed a green suite that was red.** It
  recorded `29 tests passed, 0 failed, exit 0`; the branch actually ran 29 with
  28 passing and 1 failing — the installed-verification test, failing on the
  missing-`package.json` defect above. `ACCEPTANCE.md`'s deterministic-spine box
  carried the same overstatement. The claim is corrected here and the underlying
  defect is fixed rather than the assertion softened.
- **`ACCEPTANCE.md`'s positioning-law box is reopened.** It was checked on a
  hand-run of the wrapper's pattern table while stating that the repo's own
  `_graph/done-means/positioning-law-scan.sh` was not invoked. Under Graph Mode's
  "agent produces, script judges" rule a hand-run is an agent judgment, not a
  receipt. The box stays open with the reason: the wrapper performs forced
  scratch-file deletion, which an agent may not run.

### Verified

- Plain `node --test "tests/*.test.ts"` on Node v24.19.0 from the kit root:
  32 tests, 32 passed, 0 failed, exit 0.
- The payload copied to a standalone folder outside this repo runs
  `node scripts/verify-install.ts` to `PASS` (exit 0) and
  `node scripts/check-letter-input.ts` to its own usage exit 2 — reproducing the
  0.2.2 failure first, then observing the fix.
- `room.sh` parses under Apple's stock bash 3.2.57 (`bash -n`, exit 0).
- The positioning-law scan still has NO script receipt; see `ACCEPTANCE.md`.
- No human has run this on a real agency letter. State is still WRITTEN.

## [0.2.2] - 2026-08-13

Hardening pass from the buyer's plain-Node path and a hostile engineering review.

### Fixed

- **Installed room lifecycle now runs from the payload buyers actually receive.**
  `room.sh` recognizes both the copied skill root and the source package root;
  regression tests exercise the copied payload directly.
- **R3's deliberate-omission answer is now executable and auditable.** The
  unchanged letter keeps refusing until the agency explicitly reruns with
  `--confirmed-omit-premium-context`; the pass receipt states that nothing was
  invented or added.
- **The Node floor now matches the buyer path that actually works.** The
  bisected minimum is Node 22.18.0, where the full suite and the test harness's
  unflagged child processes run TypeScript with plain `node`. The unsupported
  22.6.0 floor and strip-types workaround were removed rather than documented
  around.
- **`room new` creates a usable draft room.** It copies and fills the shipped
  workspace template itself instead of creating an empty directory that
  `init-panel.ts` then refused to initialize.
- **Version truth is synchronized.** INSTALL's header and expected verifier
  receipt, README, installer pointer, manifest, package metadata, acceptance
  ledger, embedded payload metadata, and verifier now agree on 0.2.2.
- **Worked-example claims now match the files.** Example 2 is labeled as the
  refusal-and-confirmation walkthrough it is rather than as a complete panel run.
- **Fresh installs verify before customization, and customized installs still
  verify safely.** Copy equality runs before buyer-owned files change; the local
  verifier ignores only `USER-CONFIG.md` and `branding/` and continues hashing
  every executable and instruction file.
- **Upgrades deploy executable fixes.** The installer now replaces the full
  immutable payload, including scripts and verifier metadata, while preserving
  buyer config, branding, and agency-owned workspaces.
- **Machine-readable verification honors the Node floor.** `kit.json` declares
  Node 22.18.0+ and every `.ts` verification command uses plain `node`, matching
  the commands a buyer and the test harness actually run.
- **Room operations are identity-bound and workspace-bound.** `room.sh` refuses
  another kit even when called by absolute path and reads the agency-owned root
  from `USER-CONFIG.md`; live profiles, dossiers, and runs never land inside the
  installed skill.
- **Draft room publication is staged.** Template copy and token filling happen
  under `_staging/`, including the brief's real marker forms, and the completed
  draft moves into its final room name only after every step succeeds.

### Safety

- Replaced the remaining forced single-file cleanup in `room.sh` with `unlink`;
  room removal remains archive-only.

### Deferred

- KIT-STANDARD still requires a second complete worked run. `ACCEPTANCE.md` now
  leaves that box open rather than fabricating thirteen reactions during this
  hardening pass.

### Verified

- **CORRECTED in 0.2.3 — this line was false when written.** It read
  "Plain `node --test \"tests/*.test.ts\"`: 29 tests passed, 0 failed, exit 0."
  The suite actually ran 29 with 28 passing and 1 failing on Node v24.19.0: the
  installed-verification test, failing because the copied payload shipped no
  `package.json`. Left in place rather than deleted so the overstatement stays
  visible.
- Declared development typecheck: exit 0 after installing only the declared
  development dependencies; the buyer path still requires no package install.
- **CORRECTED in 0.2.3.** This line claimed installed payload integrity,
  copied-install equality, and both pristine and customized copied-payload
  verification "all passed under plain Node." Installed-payload verification of a
  copied payload did NOT pass, and no test exercised the pristine copy at all.
  Both are covered by real tests as of 0.2.3.
- Node runtime floor, commands, and regression tests agree on 22.18.0+ with no
  strip-types workaround.
- No active Bun runtime/API/test-runner references remain.
- No human has run this on a real agency letter; state is still WRITTEN.

## [0.2.1] - 2026-08-13

Bun removed. The kit's TypeScript now runs on plain Node, so a buyer never
installs Bun to use it.

### Changed

- **Every deterministic script runs under plain `node`.** Rico ruling
  2026-08-13: kits must never require Bun of a buyer ("Bun is on its way out and
  dying"). The scripts stay TypeScript; Node executes them directly with no
  build step, no bundler, and no `npm install`.
- **Ported the three Bun-specific things:** `import.meta.dir` ->
  `import.meta.dirname`; relative imports now carry explicit `.ts` extensions,
  which Node ESM requires; `bun:test` / `Bun.spawn` / `Bun.file` -> `node --test`
  with `node:child_process` and `node:fs/promises`, via a dependency-free
  `tests/harness.ts` shim supplying the five matchers the suite uses.
- **Declared runtime changed from Bun to Node** in `kit.json`. This release's
  initial floor was later proven too low and corrected to Node 22.18.0 in 0.2.2;
  the supported buyer command is plain `node script.ts`.
- Documentation, `SKILL.md`, workflows, `INSTALL.md`, and `README.md` reworded
  from Bun to Node, including the T2 dependency section and the install receipt.
- Regenerated `KIT-METADATA.json` and the embedded verifier digests.

### Removed

- **`bun.lock` no longer ships to buyers.** It was tracked and inside the zip,
  so every buyer received a Bun lockfile pinning `@types/bun` and `bun-types`
  for a kit that no longer uses Bun. Nothing referenced it — not `kit.json`
  `verification.files`, not the integrity manifest, not any script — so it was
  orphaned Bun tooling state contradicting the ruling on the buyer's disk.

### Fixed

- Stale version strings synced to the package version: `README.md` and
  `installer.md` headers and the `INSTALL.md` receipt template all said `0.1.1`
  while `VERSION` said `0.2.0`. `package.json` was also at `0.1.1`.

### Verified

- All 22 behavior tests pass under plain `node --test` (1 panel-spine test with
  100 assertions, 21 refusal-gate tests). Exit `0`.
- `node scripts/verify-install.ts` passes: 34 non-verifier payload files match.
- No human has run this on a real agency letter; state is still WRITTEN.

## [0.2.0] - 2026-08-12

Room lifecycle. A book panel is now a named, reusable ROOM, so the seats built
from the agency's own book survive every letter tested against them.

### Added

- `skills/insurance-book-roll-panel/scripts/room.sh` — room lifecycle tooling. Bash and coreutils
  only; no Bun, no jq, no install step. Parses on Apple's stock bash 3.2.
  - `clean [--room X]` — the five-minute rerun path. Archives runs, inputs, and calibration to
    `_archive/<stamp>/`, leaves the roster and every dossier untouched, then
    asserts the room is rerun-ready.
  - `seat list | bounce <ids> | refresh <ids> --criteria "..."` — seat-level
    ops. `refresh` archives the old dossier, deactivates the seat, and stages a
    filled authoring prompt per seat; the dossier itself is written through the
    existing seat-authoring workflow and gated by the kit's validation.
  - `room new <name> [--from <room>] | room list | room archive <name>` —
    named rooms that run in parallel without sharing state.
  - `--list` dry run on every mutating command; exit `0` pass / `1` failed /
    `3` harness error; refuses to run outside a kit root; idempotent.
- `skills/insurance-book-roll-panel/workflows/room-lifecycle.md` — the workflow, including running
  N rooms concurrently and a migration note for the older layout (rooms are
  additive; the existing layout keeps working).
- README section on why an agency runs this before mailing the book, with the cost and turnaround comparison marked as an
  internal rTech estimate.

### Changed

- `SKILL.md` routes rerun/seat-swap/parallel requests to the new workflow.

### Notes

- Nothing is ever deleted. Every removal is a move into `_archive/<stamp>/`,
  and a bounced seat keeps its roster entry with `"active": false`.
- The script performs zero dossier authoring. It stages; the AI writes; the
  existing validation decides.
- Validation and right-sizing are per room. A correct room proves nothing about
  the room next door.

## [0.1.1] - 2026-08-12

Kit workout, three rounds, against three invented-but-realistic Long Island
agencies: a Bay Shore agency rolling 380 coastal homeowners to a replacement
carrier, a four-person Massapequa Park commercial-only agency cross-selling a
retired producer's book, and a Lindenhurst personal-lines agency whose carrier
is non-renewing everything within a half mile of the water.

**State: still WRITTEN.** Every defect below was found by running the kit's own
workflows against invented agency data. Nothing here was checked on a real
device by a human, and no real agency letter has been through the kit.

### Fixed

- **R3 missed the letter it exists to catch.** A carrier-roll letter whose
  entire premium disclosure was "Your premium under the new carrier is different
  from what you have been paying" PASSED the gate, which then printed "no
  unexplained premium change was found." The verb list caught only blunt
  phrasings; softening bad news is the normal case. `different from`,
  `not the same as`, `no longer`, `revised`, `updated`, `moving`, and
  `your new premium` are caught now.
- **A denied cause was read as a stated cause.** The same letter satisfied the
  reason test on the words "claims history" inside the sentence "this is not
  about you, your home, or your claims history" - a sentence DENYING a reason.
  The reason must now sit in the sentence carrying the change or the one after
  it, and a denial does not count.
- **R3 refused a good letter.** A non-renewal notice was refused for saying
  "some households in your situation end up with a higher premium" - a hedged
  possibility about other people, in a letter whose whole virtue was declining
  to promise a figure the agency did not have. R3 now fires only on a change
  ANNOUNCED to this reader; "your premium may be increasing" still owes a
  number.
- **The book-profile gate measured the template, not the agency.** A profile
  whose seven answers were "n/a", "not sure", "tbd", "see above", "ask Dennis",
  "we don't track that", and "standard stuff" - fourteen words of answer -
  passed, because with the answer slots replaced the check counted words across
  the whole file and the shipped questions supply 467 of them. It now checks the
  three load-bearing sections one at a time, subtracts any line that came from
  the shipped template, and rejects placeholder answers. "We do not know" is
  deliberately still accepted, because the template asks for it.
- **Both dissent seats are now required, matching the prose.** SKILL.md
  invariant 6, `build-book-panel.md`, `maintain-panel.md`, `book-seat-shapes.md`,
  and `PANEL-BRIEF.md` all promised two dissent seats; `validate-panel.ts` and
  `validate-run.ts` accepted either one alone, so an agency could drop the
  `wrong-fit` seat - the only seat whose YES is a failure signal - and still
  pass strict validation. Each is a separate error now.
- **The kit's own spine test violated that rule.** `tests/kit.test.ts` arrived
  verbatim from the parent marketing panel and built a six-seat panel with a
  `hard-no` and no `wrong-fit` seat, with marketing seat ids (`economic-buyer`,
  `daily-user`) in an insurance kit. Re-skinned to the book-roll domain and both
  dissent seats added.
- **A personal-lines-only agency could not build a valid panel.** Eight of the
  thirteen shipped shapes are commercial or cross-sell, leaving five seats and
  frequently no `wrong-fit` seat at all. `book-seat-shapes.md` gains five
  personal-lines shapes to swap in - the household losing coverage entirely, the
  retiree on a fixed income, the multi-generational family account, the
  inherited-policy holder, and the first-time homeowner - and the `wrong-fit`
  seat gains a general form for agencies that never cross-sell, with the test
  that its yes must be bad news.

### Added

- **Mechanical detection of injected instructions (KIT-STANDARD §4.7).** The
  hardening requirement existed only as prose telling the AI to notice text that
  addresses it, which is the vibe-instead-of-a-rule shape §4.9 rejects. The gate
  now scans every letter for lines aimed at the assistant and quotes them back
  verbatim as a warning, on the pass AND refusal paths. It is a warning rather
  than a refusal because an agency may legitimately mail a letter quoting a
  suspicious email it received.
- A warning when the only figure in a letter is an unfilled merge field: the
  seats can react to a number arriving but not to its size.
- Ten regression tests covering every defect above, including both directions of
  the hedging rule and a guard proving an agency that answers honestly while
  admitting one gap is not refused. Suite: 12 tests to 22.

### Changed

- `references/letter-input-standard.md` rewritten for R2 and R3 to state the
  per-section profile check, the softened-phrasing and denied-cause rules, the
  merge-field warning, and the injected-text scan.

## [0.1.0] - 2026-08-12

Initial build. **State: WRITTEN** — the kit exists, its own tests pass, and it
has never been run against a real agency letter or checked on a real device by a
human. Nothing here is proven in the field.

### Added

- Created the kit as a PANEL PATTERN re-skin per the kit tribunal thesis
  (`research/kits/2026-08-11_kit-quality-tribunal.md` § "1. Insurance Book-Roll
  Panel"), gating the insurance vertical launch confirmed 2026-08-12.
- Reused the proven panel mechanism unchanged from
  `pocs/kits/portable-kits/synthetic-customer-panel/`: the runner, scoring
  engine, rubric machinery, seat/synthesis/scoring contracts, all five
  validators, the copied-install verifier, and the behavior test suite. No new
  machinery was invented for work the proven kit already does.
- Added `scripts/check-letter-input.ts`, the kit's deterministic REFUSAL GATE
  (KIT-STANDARD §4.9), naming three refusal conditions: no letter of the
  agency's own (R1), no filled-in book profile (R2), and a stated premium change
  carrying neither a number nor a reason (R3). Exit `1` refuses and prints what
  could be read, what could not, and the one unblocking question. It never
  invents a premium figure, carrier, date, or book statistic.
- Added `tests/refusal.test.ts`, proving every refusal branch fires, that the
  pass case passes, that a letter with no premium claim is not caught by R3, and
  that usage (`2`) and harness (`3`) errors stay distinguishable. Verified
  red-first: 8 of 9 tests fail against an always-pass stub.
- Added the thirteen policyholder seat shapes in
  `references/book-seat-shapes.md`, grounded in the verified LI agency evidence
  in `research/vertical-selection/2026-08-11_backdoor-verification-li.md`, with
  an explicit statement that the density research supports the SHAPES existing
  and supports nothing about how a policyholder reacts — behavioral claims are
  labeled modeled assumptions until calibrated.
- Added two deliberate dissent seats per the panel's wrong-fit rule: the client
  leaving regardless (`hard-no`) and the wrong cross-sell target (`wrong-fit`),
  with the synthesis instructed to report a wrong-fit yes as a failure.
- Added `references/letter-input-standard.md`, `workflows/build-book-panel.md`,
  `workflows/wash-letter.md`, and re-skinned rewrite, calibrate, and maintain
  workflows.
- Added `assets/workspace-template/book-profile.md`, the file seats are drawn
  from and the subject of refusal condition R2.
- Added insurance boundaries to `references/safety-and-honesty.md` (no coverage,
  pricing, licensing, or compliance determinations; no policyholder identifiers
  in any run packet) and an insurance framing block to
  `references/seat-protocol.md`.
- Added `examples/` with two complete worked runs (KIT-STANDARD § Worked-example
  layer), and `ACCEPTANCE.md` recording what is checked and what is not.

### Changed

- Replaced fixture-first install verification with own-data verification
  (KIT-STANDARD §4.10): `INSTALL.md` § 13 asks for one real letter and waits,
  and reports `installed-unverified` rather than declaring success against a
  fixture. The shipped `inputs/SAMPLE-ARTIFACT.md` was removed from the
  workspace template and replaced with `inputs/PUT-YOUR-LETTER-HERE.md`, which
  states plainly that no sample letter is provided on purpose.
- Replaced `/tmp` and `$TMPDIR` use inherited from the exemplar's test suite
  with the configured temp workspace, overridable via `RTECH_SCRATCH_ROOT`
  (repo hard rule; `_graph/lane-contract.md` standing rule 2).
- Replaced the inherited recursive test cleanup with an archive move, and
  narrowed two single-file deletions to `unlink` (repo rule: an agent's cleanup
  verb is `mv`, never a recursive or forced delete).

### Not done

- No real agency letter has been washed. No human device check has happened.
  Both are required before this ships to a buyer; see `ACCEPTANCE.md`.
