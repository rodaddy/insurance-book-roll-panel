# Build the Book Panel

Read `references/panel-standard.md`, `references/book-seat-shapes.md`,
`references/dossier-standard.md`, and `references/safety-and-honesty.md`
completely before building.

The panel is built from the agency's own book. The thirteen seat shapes shipped
in the manifest are a STARTING ROSTER drawn from independent Long Island
agencies, not a fixed cast — an agency writing only personal lines cuts the
commercial seats rather than padding around them.

## 1. Set up the workspace

Read `USER-CONFIG.md` in this skill folder first. It holds
`panel workspace location:`, `agency name:`, and `who signs the letters:`. Use
those values; do not ask again for something already recorded there. If a key
you need is missing, ask for that ONE value, write it into `USER-CONFIG.md`, and
continue.

Confirm the work is happening in an owned workspace, never inside the shipped
kit or its `examples/`. Initialize:

`node "<skill-root>/scripts/init-panel.ts" --owned-root "<owned-root>" "<target>" --name "<agency> book panel"`

Do not edit the template inside `assets/`.

## 2. REFUSAL — the book profile gate

Ask the agency to fill in `book-profile.md`. Walk them through it in
conversation if that is easier and write their answers in — but the answers must
be theirs.

**Then run the gate.** It is checked mechanically, not by judgment:

`node "<skill-root>/scripts/check-letter-input.ts" "<workspace>" "<letter>"`

If it returns `R2 no-book-profile`, **STOP. ASK.** Say this, in plain words:

> We can build the panel, but not yet. Right now we do not know what your book
> actually carries — which lines you write, how it splits between personal and
> commercial, and which client shapes you deal with most. If we build seats
> without that, you get thirteen generic strangers reacting to your letter, and
> what they say will not be about your clients.
>
> Tell us those three things and we will build it. Rough is fine. We are not
> going to make them up.

Do not build a roster from assumptions about "a typical insurance agency." Do
not fill the profile in for them from the shipped examples. The examples exist
to show what a filled profile looks like, never to substitute for one.

## 3. Fill the brief

Record in `PANEL-BRIEF.md` the letter, the observable decision, the mailing
cohort, who should properly say no, what is driving the letter, the real outcome
to be counted, the horizon, and what the letter must not say.

Turn "will they like it?" into "does this client call the office within two
weeks, or set it down and start shopping?"

## 4. Collect evidence before writing seats

The agency's own history is the strongest source available and is usually
sitting unrecorded in the front desk's memory. Ask directly:

- Which past letter generated calls, and what did people say when they called?
- What did clients who left say on the way out?
- Which cross-sell attempt got replies, and from whom?
- What does the office hear every single time a renewal carries an increase?

Record each in `evidence/SOURCE-NOTES.md` with date, scope, and reliability.
Staff recollection is real evidence and is labeled as recollection, not a count.
Never record a policyholder's name, address, policy number, or claim detail.

## 5. Confirm the roster before writing dossiers

Show the agency the proposed roster with a one-line reason each seat exists, and
say plainly which seats are there to say NO. Adjust before writing anything
long: dossiers are the expensive part.

Rules that hold regardless of the agency's preference:

- 5-15 active seats; the shipped roster is 13.
- At least one active `core` seat.
- BOTH dissent seats active — the `hard-no` client who is leaving regardless AND
  the `wrong-fit` client the offer genuinely does not suit. This is enforced by
  `validate-panel.ts`, not left to judgment: each is a separate error, because
  they say no for different reasons and the `wrong-fit` seat is the only one that
  can catch a letter persuasive enough to produce a sale that should not happen.
  An agency asking to cut them is asking for a formatter; explain why the panel
  stops being worth anything without them.

**If the agency writes personal lines only, stop and re-read the roster before
going further.** Eight of the thirteen shipped shapes are commercial or
cross-sell, so a personal-lines book is left with five seats and frequently no
`wrong-fit` seat at all. Do not pad the commercial seats to make the count and
do not run a four-seat panel: swap in the personal-lines shapes in
`references/book-seat-shapes.md` § "If the agency writes personal lines only" —
the household losing coverage entirely, the retiree on a fixed income, the
multi-generational family account, the inherited-policy holder, and the
first-time homeowner. Where the agency never cross-sells, build the `wrong-fit`
seat from its general form in that reference (the client the letter's ask
genuinely does not suit), and check it against the test there: its yes must be
bad news.
- The compliance-and-claims reviewer is a `specialist`. Its gate is not a
  customer opinion and never counts as enthusiasm.

Merge seats that would predictably react the same way for the same reason.

## 6. Write the manifest and dossiers

`panel.json` is the roster source of truth; a dossier file on disk does nothing
without an active manifest entry. Set each seat `active` to `true` only once its
dossier is written.

Write one dossier per active seat from `dossiers/DOSSIER-TEMPLATE.md`, using the
shapes in `references/book-seat-shapes.md` as the starting point and the
agency's own evidence as the substance. Target 1,200-1,800 words. Validation
fails below 900 words and flags near-identical dossiers.

Model a client SHAPE, never a real policyholder. "The contractor whose general
liability renewal jumped" is a composite; the agency's actual insured with that
account is not, and does not go in a file.

Keep source-backed observation, composite modeling, and assumption visibly
separate in every dossier. Give each seat a real reason to ignore the letter.

## 7. Set scoring

The shipped dimensions total 100 and reflect what actually decides whether a
renewal letter works: whether it reads as intended, whether the stated reason is
believed, whether the relationship holds, whether the next action is clear, and
whether the dissent seats stayed honest.

Adjust the weights to the agency's real priority if they have one, keep the
total at 100, and keep a dimension that protects dissent. Do not import a
threshold from another panel.

## 8. Validate

`node "<skill-root>/scripts/validate-panel.ts" "<workspace>"`

Fix every error. Read the warnings rather than suppressing them. Report the
ready roster, the evidence gaps, the assumptions, the dissent seats, the
weights, and the outcome that will later test all of it.

Do not wash a real letter until strict validation passes.
