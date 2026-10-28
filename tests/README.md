# tests

Behavior tests for the panel spine and the refusal gate, run with plain
`node --test`.

`refusal.test.ts` proves every refusal branch fires (R1, R2, R3, and the
injection warnings); `kit.test.ts` covers the panel spine; `room.test.ts` covers
the installed-room lifecycle; `harness.ts` is the shared harness.

The harness builds disposable case folders and MOVES a finished case into an
archive root rather than deleting it. Both roots are overridable via
`BOOK_ROLL_TEST_SCRATCH_ROOT` and `BOOK_ROLL_TEST_ARCHIVE_ROOT`.
