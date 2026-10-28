# Maintain the Panel

Read `references/panel-standard.md`, `references/book-seat-shapes.md`,
`references/dossier-standard.md`, and `references/calibration-standard.md`.

A book changes. The panel is worth keeping only if it changes with it.

## Refresh triggers

- The agency acquires a book or rolls one to a new carrier, changing what the
  seats are actually holding.
- A line grows or shrinks enough that the roster no longer reflects the book.
- Repeated calibration misses trace to the same seat or to a shape nobody
  modeled.
- The front desk starts hearing something new after mailings.
- The review date in `panel.json` arrives.

## Procedure

1. Preserve every completed run and its snapshot. History is not edited.
2. Update `book-profile.md` first — it is what the roster is drawn from, and a
   roster updated ahead of the profile drifts from the book silently.
3. Append the new evidence to `evidence/SOURCE-NOTES.md`.
4. Say which seat assumptions the new evidence supports, contradicts, or leaves
   open. Contradicted assumptions are the valuable ones.
5. Update only the affected dossiers and roster entries.
6. Add, merge, deactivate, or replace seats explicitly in `panel.json`. A
   dossier on disk never activates itself.
7. Keep at least one core seat and at least two seats who should say no. A panel
   that loses its dissent seats during maintenance has quietly become a
   formatter, which is the exact failure this kit exists to avoid.
8. Revalidate: `node "<skill-root>/scripts/validate-panel.ts" "<workspace>"`
9. Record the change and its expected effect in the brief's change log.

Keep the roster between 5 and 15 active seats. A seat earns its place by
reacting differently for a substantive reason, not by adding variety.
