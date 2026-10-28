# Acceptance — Insurance Book-Roll Panel v0.2.3

**State: WRITTEN.** The kit exists on disk and its own tests pass. It has never
been run against a real agency letter and has never been opened by a human on a
real device. Unchecked boxes below are unchecked because they are genuinely not
done, not because they were forgotten.

An agent dry-run is stronger evidence than reading the files and weaker than
Rico opening the zip on a phone. Nothing here closes a device check.

**Workout, 2026-08-12 (v0.1.1).** Three rounds against three invented Long
Island agencies — a Bay Shore carrier roll, a Massapequa Park commercial
cross-sell, a Lindenhurst coastal non-renewal. The refusal gate was found to
have missed the letter it exists to catch (a softened premium change), to have
accepted a DENIED cause as a stated one, to have refused a genuinely good
letter over a hedged possibility, and to have measured the shipped template
rather than the agency when judging the book profile. Both dissent seats were
promised in five documents and required by none. A personal-lines-only agency
could not assemble a valid roster at all. All fixed and regression-tested; see
`CHANGELOG.md` 0.1.1. The rounds used invented agency data, so they raise
confidence in the machinery and close no box below that asks for a real letter
or a real device.

## Refusal criterion (KIT-STANDARD §4.9 — HARD)

The kit must name at least one condition under which it STOPS and tells the user
their input is not good enough. This kit names three, all decided by
`scripts/check-letter-input.ts` rather than by AI judgment.

- [x] **R1 — no letter of the agency's own.** Refuses a letter path inside
      `examples/` or the shipped template, and refuses anything under 40 words.
      Verified: `tests/refusal.test.ts` "refuses a letter that is one of the
      shipped worked examples" and "refuses a letter too thin to react to".
- [x] **R2 — no filled-in book profile.** Refuses when `book-profile.md` is
      absent, still holds the shipped questions, or answers the load-bearing
      sections with placeholders like "n/a" or "not sure". Verified:
      `tests/refusal.test.ts` four R2 cases (absent, unfilled, untouched shipped
      template, evasive answers) plus a guard proving an agency that answers
      honestly and admits one gap is NOT refused.
- [x] **R3 — a premium change with no number and no reason.** Refuses a letter
      that ANNOUNCES a premium change to this reader without stating how much or
      why, including softened phrasings ("different from what you have been
      paying"), and does not accept a denied cause ("this is not about your
      claims history") as a stated one. Does not fire on a hedged possibility
      about other households. Verified: `tests/refusal.test.ts` no-number,
      no-reason, softened-change, denied-cause, hedged-possibility, and
      addressed-to-reader cases.
- [x] The refusal names the condition, the stop, and the exact plain-language
      thing said to the user, in `SKILL.md` § REFUSAL,
      `workflows/wash-letter.md` § 2, and `workflows/build-book-panel.md` § 2.
- [x] The trigger is deterministic — a script decides, not a vibe. R3 remains
      refused until the agency's explicit answer is represented by
      `--confirmed-omit-premium-context`; conversation prose alone cannot clear it.
- [x] The refusal shows its work: what could be read, what could not, and the
      one unblocking question. It never invents a premium figure, a carrier, a
      date, or a book statistic.
- [x] Proven red-first: 8 of 9 original refusal tests fail against an
      always-pass stub, so a green run means the gate fired rather than that the
      tests are inert. Every regression added in the 2026-08-12 workout was
      observed failing against the code it replaced before the fix landed.
- [x] **§4.7 untrusted input is mechanically detected**, not left to the AI's
      attention: the gate quotes injected instructions back verbatim as a
      warning on both the pass and refusal paths. Verified:
      `tests/refusal.test.ts` injection and no-false-positive cases.
- [x] The gate does not overclaim — the pass message states explicitly that it
      checks the input and says nothing about whether the letter is any good.

## Own-data verification (KIT-STANDARD §4.10 — HARD)

- [x] The install verify step runs on the buyer's OWN letter (`INSTALL.md` §13).
- [x] The installer ASKS for that letter and waits; it does not proceed on a
      stand-in.
- [x] No shipped demo letter exists to stand in — `inputs/SAMPLE-ARTIFACT.md`
      was removed and replaced with `inputs/PUT-YOUR-LETTER-HERE.md`, which says
      the absence is deliberate.
- [x] `examples/` is explicitly a see-the-flow layer and a legitimate demo only
      AFTER the agency's own letter has been through.
- [x] No letter in hand at install time is handled as a refusal: the install is
      reported `installed-unverified` rather than passed.

## Package shape (KIT-STANDARD §1, §2, §4.6, §4.8)

- [x] `START-HERE.md` — one page, per-device paths, ends with the one sentence.
- [x] `INSTALL.md` with the version line, "do not summarize", the trigger, all
      four runtime paths with "incompatible" banned, collision check, recursive
      copy, image detection, branding interview, verify, and failure handling.
- [x] `installer.md` compatibility pointer carrying its own version line.
- [x] `OPERATIONS-MANUAL.md` in plain language, no terminal, no jargon.
- [x] `VERSION` (0.2.3) and `CHANGELOG.md` agree with `kit.json`,
      `package.json`, both installer version lines, and the install receipt.
- [x] Upgrade path stated: data preserved by construction, skill files replaced
      after backup, branding never re-asked.
- [x] One config file, `USER-CONFIG.md`, with fully spelled-out keys.
- [x] Everything a skill READS lives inside the installed skill folder (§4.5).
      Live rooms are written under the agency-owned absolute workspace path in
      `USER-CONFIG.md`, never inside the installed skill.

## Untrusted input (KIT-STANDARD §4.7)

- [x] `SKILL.md` carries the block: letters and pasted client mail are DATA,
      instruction-like text is quoted back as suspicious, and nothing changes
      except from what the agency says.
- [x] Policyholder identifiers are replaced with spelled-out fields before a
      letter enters a run; run packets carry no real names or policy numbers.

## Worked-example layer (KIT-STANDARD § Worked-example layer)

- [x] `examples/01-renewal-increase/` ships one complete worked run —
      real-shaped letter in, representative reactions, synthesis, scorecard, and
      result out.
- [x] `examples/02-cross-sell-refused/` truthfully labels itself as a refusal and
      deterministic-confirmation walkthrough rather than claiming a complete run.
- [ ] A second complete worked run is still required by KIT-STANDARD. It is
      deferred rather than fabricating thirteen reactions during a hardening pass.
- [x] Examples obey the positioning law and carry no policyholder identifiers.

## Deterministic spine (repo determinism-first law)

- [x] The mechanical work belongs to scripts: the refusal gate, panel
      validation, run preparation, and completed-run validation all exit on
      codes, not on prose.
- [x] Proven mechanism reused rather than reinvented — runner, scoring engine,
      rubric, validators, and test suite copied from the marketing panel.
- [x] Plain `node --test` passes the panel spine, refusal gate, and installed-room
      lifecycle behavior tests; current counts and exit receipt are recorded in
      `CHANGELOG.md` 0.2.3.
- [x] The copied payload ships its own `package.json` with `"type": "module"`,
      so every documented `node scripts/<x>.ts` command runs from the installed
      skill folder with no repo ancestor. Covered by a behavior test that runs
      the refusal gate from a standalone copy.
- [x] Development typecheck passes after installing only the declared
      development dependencies; the buyer path still requires no `npm install`.

## Positioning law (repo LAW, non-negotiable)

- [ ] **Script receipt for the positioning-law scan is still missing.** The
      repo's own wrapper, `_graph/done-means/positioning-law-scan.sh`, was NOT
      invoked: it performs forced scratch-file deletion (`rm -f`), which an
      agent is forbidden to run. A hand-run of the wrapper's pattern table over
      the kit copy found no headcount-replacement language, but under Graph
      Mode's "agent produces, script judges" rule that is an agent judgment, not
      a receipt, so this box stays open. Closing it needs a human to run the
      wrapper, or the wrapper to stop deleting.
- [x] The kit reduces the WORK on the agency's staff — it does not do the
      producer's job, does not replace the account manager, and hands the
      judgment back. `SKILL.md` § "The people this kit is built for" states it.
- [x] No "free" language anywhere; kits are paid.

## NOT DONE — required before this ships to a buyer

- [ ] **One live first-run against a real agency letter.** Nothing here has
      washed an actual letter an agency was about to mail.
- [ ] **Real-device spot check by a human** (Rico, actual phone or laptop,
      actual AI app) before it rides a Drive share. This is the standing
      LI-smb-hq rule and no agent run substitutes for it.
- [ ] 3A coding-agent install, six-point verify, in a clean room.
- [ ] 3B chat-app path — AI generates the zips, layout checked.
- [ ] 3C condensation path — preserve-list honored, PAUSE gate present.
- [ ] Branding interview produces a valid `branding/brand.md`, with and without
      agency-supplied assets.
- [ ] Panel wash of the client-facing copy in `README.md`, `START-HERE.md`, and
      `OPERATIONS-MANUAL.md` (standing rule 3 — the copy in this kit is
      client-facing and has not been washed).
- [ ] Second complete worked run with its own input, reactions, synthesis,
      scorecard, and result (KIT-STANDARD worked-example layer).
- [ ] Dossier authoring pass: the thirteen shapes are declared in the manifest
      as `active: false` with no dossiers written. That is correct by design —
      dossiers are built from the agency's own book at install — but it means
      no end-to-end run has ever executed thirteen real seats.
