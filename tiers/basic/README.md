# basic

The only tier of the Insurance Book-Roll Panel kit.

## What ships

The complete package: `START-HERE.md` (per-device unzip instructions),
`INSTALL.md` (the canonical agent-executed installation contract),
`installer.md` (a compatibility pointer to `INSTALL.md`),
`OPERATIONS-MANUAL.md` (plain-language guide for the person writing the
letters), `ACCEPTANCE.md` (the ship checklist, including what is not yet done),
`kit.json` and `kit.schema.json` (declared requirements, payloads, boundaries),
`VERSION` and `CHANGELOG.md`, `examples/` (one complete worked run and one
refusal walkthrough), `skills/insurance-book-roll-panel/` (the portable skill),
and `tests/` (behavior tests for the panel spine and the refusal gate).

What it does: the agency's renewal letter, cross-sell email, or book-roll
announcement goes in; thirteen dossier-backed policyholder seats read it
independently and say whether they would call back; a weighted rubric scores it;
three rewrites are tested the same way.

## Who it is for

Independent insurance agencies, and specifically the person who actually writes
the letters. No technical background is assumed, and nothing in the operations
manual requires opening a terminal. It takes work off that person's plate: they
stay the author and the licensed professional, and they get the objection read
back to them while there is still time to fix it.

## What it refuses to do

`scripts/check-letter-input.ts` decides three refusals and exits `1` on each:

1. **No letter of the agency's own** - it will not run on the shipped examples,
   and refuses anything under 40 words.
2. **No filled-in book profile** - absent, still holding the shipped questions,
   or answered with placeholders, because the seats would then be thirteen
   generic strangers.
3. **A premium change with no number and no reason** - including softened
   phrasings, and it does not accept a denied cause as a stated one. The agency
   may deliberately omit both, but must say so through
   `--confirmed-omit-premium-context`; the kit will not supply a figure or a
   cause.

Every refusal prints what could be read, what could not, and the one question
that unblocks it. Beyond the gate, it does not give insurance advice, read
policy language, price anything, or send anything.

## Install

The steps as they stand in `installer.md` and the `INSTALL.md` it points to:

1. Send `installer.md` to the AI and say **install insurance book-roll panel**.
   `installer.md` is only a pointer; the AI reads and executes `INSTALL.md` in
   full rather than summarizing it.
2. Read `kit.json`, then `README.md`, then `OPERATIONS-MANUAL.md`; validate
   every declared entrypoint, payload, and verification file; check the declared
   runtime - Node 22.18.0 or newer, run with plain `node`.
3. Select the strongest honest mode: `full`, `persistent-files`, `session-only`,
   or `handoff-required`. "Incompatible" is a banned answer.
4. Report the mode, destination, runtime status, and expected changes; run the
   collision check; then recursively copy the entire skill folder.
5. Verify the copy from the retained source with
   `node verify-copied-install.ts "<copied-destination>"`, then from the copy
   with `node scripts/verify-install.ts`, which must report
   `PASS insurance-book-roll-panel@0.2.3`.
6. Record the image lane in `branding/image-setup.md`, run the branding
   interview into `branding/brand.md`, and record the agency's choices in
   `USER-CONFIG.md`.
7. Verify on one of the agency's OWN letters, never on `examples/`: run
   `node scripts/check-letter-input.ts "<workspace>" "<letter>"`, then build the
   panel and wash the letter per `workflows/build-book-panel.md` and
   `workflows/wash-letter.md`. With no letter in hand, the install is reported
   `installed-unverified`.

## Current version

`VERSION`: 0.2.3
