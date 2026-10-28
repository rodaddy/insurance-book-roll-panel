# How the Insurance Book-Roll Panel was built

Sources: `CHANGELOG.md`, `ACCEPTANCE.md`, the commit history of the private
monorepo the kit was developed in (it was published here as a single snapshot
commit on 2026-10-27), and the test files.

## The problem and the first version (2026-08-12)

Independent agencies send renewal, cross-sell and book-roll letters to their
whole book at once, and the first real feedback is a wave of calls or
non-renewals. A general-purpose synthetic customer panel already existed in
the same kit line (see the portable-kits reference kit). A quality review of
the line on 2026-08-11 picked insurance agencies as a vertical for it.

Version 0.1.0 was built on 2026-08-12 by an AI agent as a "re-skin": the
panel's runner, scoring engine, rubric machinery, seat contracts, validators,
copied-install verifier and behaviour tests were reused unchanged, and only the
insurance layer was written new. The rule was not to invent machinery for work
the proven kit already did. New in that version:

- `check-letter-input.ts`, a deterministic refusal gate with three conditions:
  no letter of the agency's own (R1), no filled-in book profile (R2), and a
  premium change with neither a number nor a reason (R3).
- Thirteen policyholder seat shapes. Public data (US Census County Business
  Patterns for Nassau and Suffolk) supports that agencies with this client mix
  exist; it says nothing about how a policyholder reacts, so every behavioural
  claim is labelled a modelled assumption until calibrated against a real
  mailing.
- Two deliberate dissent seats, and insurance boundaries: no coverage, pricing,
  licensing or compliance determinations.

The refusal tests were checked "red-first": 8 of 9 failed against a stub that
always passed, which showed they could catch a broken gate.

## Simulated agencies (2026-08-12)

The same day, AI agents ran the kit's own workflows in three rounds as three
invented Long Island agencies: one rolling coastal homeowners to a new carrier,
a commercial-only agency cross-selling a retiring producer's book, and a
personal-lines agency whose carrier was non-renewing homes near the water.
Version 0.1.1 fixed what they found:

- **R3 missed the letter it existed to catch.** "Your premium under the new
  carrier is different from what you have been paying" passed, because the gate
  only knew blunt phrasings. Softened wording is now caught.
- **A denied reason counted as a reason.** "This is not about your claims
  history" satisfied the reason test. Denials no longer count.
- **R3 refused a good letter** for a hedged sentence about other households. It
  now fires only on a change announced to the reader.
- **The book-profile check measured the template, not the agency.** A profile
  answered with "n/a", "tbd" and "see above" passed, because the shipped
  questions alone supplied enough words. The check now reads the three
  load-bearing sections one at a time and ignores template text.
- **Dissent seats were promised in five documents and required by none.** The
  validators now require both.
- **A personal-lines-only agency could not build a valid panel.** Five
  personal-lines seat shapes were added.

The gate also gained a mechanical scan for lines in a letter that address the
AI directly; it quotes such lines back as a
warning. The suite went from 12 to 22 tests. The acceptance file notes that
invented agencies raise confidence in the machinery but cannot stand in for a
real letter.

## Reusable rooms and plain Node (2026-08-12 to 2026-08-13)

Version 0.2.0 made a panel a named, reusable room. `room.sh`, written for the
bash 3.2 that ships on macOS, resets a room for the next letter by archiving,
never deleting. Version 0.2.1 moved the TypeScript from Bun to plain Node so a
buyer never installs Bun. Version 0.2.2 came from a review of the buyer's
plain-Node path: the room script now works from the copied payload, the R3
"deliberately omitted" answer became an explicit flag, and the Node floor was
narrowed (bisected) to 22.18.0, the first release where the whole suite runs as
written.

## Two-model review (2026-08-17)

Claude Opus and a GPT-family reviewer reviewed version 0.2.2 and found two
serious problems:

1. **The installed kit could not run.** The copied payload had no
   `package.json`, so Node treated its TypeScript as CommonJS and every
   documented command failed with a syntax error, including the refusal gate.
   It only worked inside the development repo because a parent folder supplied
   the setting. The payload now carries its own `package.json`, and a test runs
   the gate from a standalone copy.
2. **A green record over a red suite.** The 0.2.2 changelog said 29 of 29
   tests passed; one had failed. The record was corrected and the underlying
   defect fixed, rather than the test weakened.

The same review fixed a failed `room new` leaving a hidden staging folder
behind, and removed a hard-coded internal path from the shipped tests. The
suite reached 32 tests.

## How it is tested

- `tests/refusal.test.ts`: every refusal branch, the pass case, the hedging
  rules in both directions, and distinct exit codes for usage and harness
  errors.
- `tests/kit.test.ts`: the panel spine (build, validate, prepare and validate a
  run) on the book-roll domain.
- `tests/room.test.ts`: the room lifecycle and installed-copy integrity.
- `ACCEPTANCE.md`: a checklist that keeps unproven items unchecked, including
  a live run on a real agency letter and a person checking it on a real device.

## Current state (2026-10-27)

Version 0.2.3, experimental. 30 of 32 tests passed until 2026-10-28. The two
failures were installed-integrity tests: folder README files added on
2026-08-24 were not in the payload's integrity record, and the generator that
refreshes it could not rewrite the verifier's wrapped digest constant. The
generator was fixed, the record regenerated, and all 32 tests now pass. No
real agency letter has been through the kit yet.
