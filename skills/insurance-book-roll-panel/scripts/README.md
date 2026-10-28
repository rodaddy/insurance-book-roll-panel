# scripts

The deterministic spine. The script decides, not the AI, and each one exits on a
code rather than on prose.

`check-letter-input.ts` is the refusal gate and exits `1` on a refusal.
`init-panel.ts`, `prepare-run.ts`, `validate-panel.ts`, `validate-run.ts`, and
`lib.ts` are reused verbatim from the proven panel. `verify-install.ts` proves
the immutable installed payload. `room.sh` is the room lifecycle in bash and
coreutils only, so it works on a bare Mac with nothing installed.

Every `.ts` entrypoint runs with plain `node` (22.18.0 or newer), with no build
step and no `npm install`.
