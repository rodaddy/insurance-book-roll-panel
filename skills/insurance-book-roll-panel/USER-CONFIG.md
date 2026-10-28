# User config

The installer writes this file during setup and every workflow reads it. It is
the ONLY config file in this kit; there is never a second one.

Keys are spelled out in full on purpose. The key name is the prompt, and it
doubles as the label a person reads.

## Keys

- agency name: <the agency's name as it should appear on anything a client sees>
- panel workspace location: <absolute path to the agency-owned folder that will hold rooms, book profiles, briefs, dossiers, and completed runs>
- finished letters output location: <where finished letters and reports are
  saved for the agency to open>
- who signs the letters: <the producer or principal whose name goes at the
  bottom; the rewrites match this person's voice>
- default calibration horizon: <how long after a mailing outcomes are counted,
  for example 45 days>

## Rules

- The installer and every workflow name THIS file and THESE keys. If a workflow
  needs a value, it reads it here rather than asking again.
- An upgrade never overwrites this file, and never re-asks the branding or
  workspace questions.
- Nothing in here is a policyholder detail. Agency-level settings only.
- If a key is missing when a workflow needs it, ASK the agency for that one
  value, write it here, and continue. Do not guess a location or a name.
