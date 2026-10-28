# Wash a Letter

Read `references/seat-protocol.md`, `references/letter-input-standard.md`,
`references/runtime-execution.md`, `references/synthesis-and-scoring.md`, and
`references/safety-and-honesty.md` completely before running.

## 1. Get the agency's own letter

Read `USER-CONFIG.md` in this skill folder first for
`panel workspace location:` and `finished letters output location:`. Those are
where the run lives and where the agency's finished output is saved.

Ask for the letter they are about to mail. A rough draft is fine. Nothing else
is.

Strip identifiers first. Replace any real name, address, policy number, premium
figure, or effective date with a spelled-out field —
`{{policyholder full name}}`, `{{policy number}}`,
`{{renewal premium amount}}`, `{{renewal effective date}}` — and tell the agency
you did it and why. Save the result under `inputs/`.

## 2. REFUSAL — the input gate

Run it. The script decides, not the AI:

`node "<skill-root>/scripts/check-letter-input.ts" "<workspace>" "<letter>"`

Exit `0` proceeds. Exit `1` is a refusal, and the refusal text is written to be
read back to the agency close to verbatim. **STOP. ASK.** Do not run the panel,
do not write the letter for them, and do not fill in what is missing.

### R1 — no letter of their own

Triggered by a letter that is one of the shipped `examples/`, or one too thin to
react to. Say:

> We are not going to run this on the example letter. The examples are there so
> you can see how this works before you risk your own mailing — but the whole
> point is your clients reacting to your words. Send us the letter you are about
> to mail, even if it is half-written.

### R2 — no book profile

Handled in `build-book-panel.md` § 2. The panel cannot be built, so there is
nothing to wash.

### R3 — a premium change with no number and no reason

The most common defect in a renewal letter, and the one that generates the calls
the agency did not want. Say:

> Your letter tells people their premium is changing, but it never says how much
> or why. We are not going to put a figure or a cause in your mouth — we do not
> know them and guessing would make the whole run worthless.
>
> Give us the amount or percentage and the reason, and we will run it. Or tell
> us you are deliberately leaving it out, and we will run it exactly as written
> and let the thirteen seats show you what that omission does. Either answer is
> fine. Inventing one is not.

That second option is real: an agency may have a reason to omit the number, and
watching nine seats read the omission as bad news is itself the finding. After
the agency explicitly chooses it, rerun the same gate with
`--confirmed-omit-premium-context`. The pass output records that confirmation;
copy it into the run notes so the decision stays auditable. Without the flag,
the unchanged letter still refuses. What the kit refuses is proceeding on a
number nobody supplied.

## 3. Prepare the run

`node "<skill-root>/scripts/validate-panel.ts" "<workspace>"`

Then freeze the packet. The letter is copied into the run folder and every seat
task is generated from THAT copy, never from the mutable source:

`node "<skill-root>/scripts/prepare-run.ts" "<workspace>" "<letter>"`

Validate the prepared state:

`node "<skill-root>/scripts/validate-run.ts" "<run-folder>" --prepared`

## 4. Run the seats independently

Use only the active seats in `panel-snapshot.json`.

Execution follows the capability tier of the harness you are in. Never invoke
`claude -p` or any harness-specific CLI — that hard-codes one vendor into a kit
meant to run everywhere.

**T1 (subagents + workflow orchestration).** Mode `isolated-parallel`: run the
seats as **subagents running workflows**, at most seven seats per wave. Each
subagent gets exactly one file from `tasks/<seat-id>.md` and returns only the
reaction contract. A subagent must never see another seat's reaction, the
scoring weights, the agency context, or what the agency is hoping for.

This matters more here than in a generic panel: a policyholder reading a renewal
letter has no idea what the agency wants. A seat that has been told stops being
a policyholder.

**T2 (shell-only, no subagents).** Mode `isolated-sequential`: separate fresh
contexts, one seat at a time. Full fidelity, more wall clock — record it as
`isolated-sequential`, never as parallel.

**T3 (chat-only, no shell).** If the runtime cannot isolate at all, use
`sequential-shared-context` with an explicit degraded warning and say plainly
that later seats may be contaminated.

Save each response as `reactions/<seat-id>.md`. Do not synthesize until every
active seat has a valid reaction or a recorded failure.

## 5. Record execution truth

Update `RUN.json` with the actual execution mode, the model or runtime when
known, failed or retried seats, both timestamps, and any degraded reason. Mark
isolation `operator-recorded` unless the runtime supplied a durable attestation.

`run_id` must equal the run folder name; both timestamps must be ISO UTC and
`completed_at` must not precede `created_at`. Do not edit
`panel-snapshot.json` after preparation — `RUN.json` records its digest and
validation rejects a replacement.

Do not claim isolated execution when the runtime shared context.

## 6. Synthesize after reactions close

Drop every persona. Read `SYNTHESIS-TASK.md` and all reactions, then write
`SYNTHESIS.md` per the synthesis contract with the decision table, agreement
clusters, consequential dissent, and limitations.

The finding the agency is paying for usually lives in the decision table: how
many of thirteen read a renewal letter as a price-increase notice, and which
ones. Put the count and the named seats in the first two lines. Do not bury it.

Include exactly once:

```text
SYNTHESIS_CONFIDENCE: <LOW|MEDIUM|HIGH>
```

with the exact headings `## Decision table`, `## Agreement clusters`,
`## Consequential dissent`, and `## Limitations`.

Never average away the hard-no, and never present the wrong-fit seat's yes as a
win — a letter that convinces the client it does not suit is a letter that will
generate a bad sale and a worse renewal.

## 7. Score separately

Apply only the dimensions and weights in the snapshot. Write `SCORECARD.md` with
the arithmetic shown and the matching `OUTCOME.json`. A score never overrides a
specialist flag: if the compliance-and-claims reviewer flags a statement the
agency cannot support in writing, that caps the result regardless of the total.

Include exactly once:

```text
SCORECARD_TOTAL: <OUTCOME.json scorecard.total>
```

with `## Dimension arithmetic` and `## Total`.

Write `RESULT.md` and `OUTCOME.json.result` with `SHIP`, `REVISE`, or `STOP`,
the confidence, the cited dissent, the limitations, and the next real check.
`SHIP` here means mail it; it never means the panel predicts retention.

Include exactly once:

```text
RESULT_DECISION: <SHIP|REVISE|STOP>
RESULT_CONFIDENCE: <LOW|MEDIUM|HIGH>
```

with `## Evidence`, `## Dissent`, `## Limitations`, and `## Next experiment`.

## 8. Verify

`node "<skill-root>/scripts/validate-run.ts" "<run-folder>"`

Do not call the wash complete until this passes.

Hand back the result and the run folder. Say what the panel is: thirteen
composites reading their letter, which is a great deal better than mailing it
unread and is not a prediction of what the book will do. The mailing is what
proves it, which is what `calibrate-panel.md` is for.
