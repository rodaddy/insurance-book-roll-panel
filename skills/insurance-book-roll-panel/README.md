# insurance-book-roll-panel skill

The portable skill payload - the part that gets copied to the installed
destination and does the work.

`SKILL.md` is the entrypoint; `KIT-METADATA.json` and `package.json` declare it;
`USER-CONFIG.md` holds the agency's own choices. `workflows/` carries the
procedures, `references/` the standards, `scripts/` the deterministic spine,
`assets/workspace-template/` the workspace skeleton, `agents/` the harness
adapter.

Everything the skill reads lives inside this folder. Live runs are written to
the agency-owned workspace path recorded in `USER-CONFIG.md`, never here.
