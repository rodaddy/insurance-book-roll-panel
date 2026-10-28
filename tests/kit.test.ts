import {
  afterAll,
  archiveRoot,
  describe,
  expect,
  runCommand,
  scratchRoot,
  test,
} from "./harness.ts";
import {
  mkdtemp,
  mkdir,
  readFile,
  rename,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import { basename, join, resolve } from "node:path";

import { REQUIRED_DOSSIER_HEADINGS } from "../skills/insurance-book-roll-panel/scripts/lib.ts";

const KIT_ROOT = resolve(import.meta.dirname, "..");
const SCRIPT_ROOT = join(
  KIT_ROOT,
  "skills",
  "insurance-book-roll-panel",
  "scripts",
);
let caseRoot = "";

// scratchRoot()/archiveRoot() come from ./harness.ts. They default to the OS
// temporary directory so a buyer's copy of this suite runs on their machine, and
// rTech's own runs point them at the configured temp workspace by exporting
// BOOK_ROLL_TEST_SCRATCH_ROOT / BOOK_ROLL_TEST_ARCHIVE_ROOT (or the legacy
// RTECH_SCRATCH_ROOT / RTECH_ARCHIVE_ROOT). Cleanup is always `mv` into the
// archive root, never a recursive delete.

interface CommandResult {
  code: number;
  stdout: string;
  stderr: string;
}

interface SnapshotFixture {
  panel: Record<string, unknown>;
  seats: Array<Record<string, unknown>>;
  scoring: { dimensions: Array<Record<string, unknown>> };
}

async function runScript(
  script: string,
  args: string[],
): Promise<CommandResult> {
  return runCommand(["node", join(SCRIPT_ROOT, script), ...args], KIT_ROOT);
}

function detailWords(seed: string, count = 30): string {
  return Array.from(
    { length: count },
    (_, index) =>
      `${seed}finding${index} ${seed}constraint${index} ${seed}behavior${index}`,
  ).join(" ");
}

function dossier(seatId: string, name: string, filler = false): string {
  const seed = seatId.replace(/-/g, "");
  const sections = REQUIRED_DOSSIER_HEADINGS.map((heading, index) => {
    const content = filler
      ? Array.from(
          { length: 60 },
          () => "repeated filler phrase evidence assumption context decision",
        ).join(" ")
      : detailWords(`${seed}${index}`);
    if (heading === "Evidence basis") {
      return `## ${heading}\n\n- Evidence: ${seed} interview observation — shows a distinct decision constraint in the synthetic test fixture.\n\n${content}`;
    }
    if (heading === "Modeled assumptions") {
      return `## ${heading}\n\n- Assumption: ${seed} composite choice — can be checked against a distinct real-world observation after the test.\n\n${content}`;
    }
    return `## ${heading}\n\n${content}`;
  });
  return [`# ${name}`, "", `Seat ID: ${seatId}`, "", ...sections, ""].join(
    "\n",
  );
}

function reaction(seat: { id: string; kind: string; fit: string }): string {
  const specialist = seat.kind === "specialist";
  return [
    `SEAT_ID: ${seat.id}`,
    `DECISION: ${specialist ? "NOT-APPLICABLE" : seat.fit === "hard-no" ? "NO" : "YES"}`,
    `INTENSITY: ${specialist ? "NOT-APPLICABLE" : "4"}`,
    `GATE: ${specialist ? "FLAG" : "NOT-APPLICABLE"}`,
    "CONFIDENCE: MEDIUM",
    "REACTION: The controlled workflow claim is specific enough for this deterministic fixture reaction.",
    "LANDS: The constrained workflow language names a concrete operational outcome.",
    "RESISTS: The evidence remains directional and needs a real-world check.",
    "MISSING: A concrete demonstration with observable implementation details.",
    "CHANGE: Add one concrete demonstration before asking for the next action.",
  ].join("\n");
}

function outcome(): Record<string, unknown> {
  const citation = {
    seat_id: "tenured-personal-lines-loyalist",
    field: "REACTION",
  };
  const dissent = { seat_id: "already-leaving-regardless", field: "DECISION" };
  return {
    schema_version: 1,
    scorecard: {
      dimensions: [
        {
          id: "core-fit",
          raw_score: 80,
          weighted_contribution: 32,
          evidence: [citation],
        },
        {
          id: "trust",
          raw_score: 70,
          weighted_contribution: 24.5,
          evidence: [citation],
        },
        {
          id: "action",
          raw_score: 60,
          weighted_contribution: 15,
          evidence: [citation],
        },
      ],
      total: 71.5,
    },
    synthesis: {
      evidence: [citation],
      dissent: [dissent],
      confidence: "MEDIUM",
      limitations: [
        "Synthetic reactions are directional and require measured real-world comparison.",
      ],
    },
    result: {
      decision: "REVISE",
      confidence: "MEDIUM",
      evidence: [citation],
      dissent: [dissent],
      limitations: [
        "The fixture has no real customer outcome and cannot establish conversion behavior.",
      ],
      next_experiment:
        "Show the revised page to five qualified operators and record requested review calls.",
    },
  };
}

function synthesisMarkdown(confidence = "MEDIUM"): string {
  return [
    `SYNTHESIS_CONFIDENCE: ${confidence}`,
    "",
    "# Synthesis",
    "",
    "## Decision table",
    "The buyer pattern is directional and the hard-no remains visible.",
    "",
    "## Agreement clusters",
    "The fixture reactions agree that a concrete demonstration is still needed.",
    "",
    "## Consequential dissent",
    "The hard-no seat rejects the claim until policy constraints are addressed.",
    "",
    "## Limitations",
    "Synthetic reactions require measured real-world comparison before any claim.",
  ].join("\n");
}

function scorecardMarkdown(total = "71.5"): string {
  return [
    `SCORECARD_TOTAL: ${total}`,
    "",
    "# Scorecard",
    "",
    "## Dimension arithmetic",
    "The frozen dimensions and cited reactions produce the stated directional score.",
    "",
    "## Total",
    "The displayed total is the sum of the validated weighted contributions.",
  ].join("\n");
}

function resultMarkdown(decision = "REVISE", confidence = "MEDIUM"): string {
  return [
    `RESULT_DECISION: ${decision}`,
    `RESULT_CONFIDENCE: ${confidence}`,
    "",
    "# Panel Result",
    "",
    "## Evidence",
    "The fixture supports a controlled revision rather than a production claim.",
    "",
    "## Dissent",
    "The hard-no objection remains a consequential constraint on the next step.",
    "",
    "## Limitations",
    "The test cannot establish conversion behavior without real customer evidence.",
    "",
    "## Next experiment",
    "Show the revised page to qualified operators and record their requested review calls.",
  ].join("\n");
}

afterAll(async () => {
  if (!caseRoot) return;
  await mkdir(archiveRoot(), { recursive: true });
  await rename(
    caseRoot,
    join(archiveRoot(), `${basename(caseRoot)}-${Date.now()}`),
  );
});

describe("insurance book-roll panel kit", () => {
  test("confines a portable workspace and validates the deterministic methodology", async () => {
    await mkdir(scratchRoot(), { recursive: true });
    caseRoot = await mkdtemp(join(scratchRoot(), "insurance-book-roll-panel-"));
    const ownedRoot = join(caseRoot, "owned");
    const workspace = join(ownedRoot, "workspace");
    await mkdir(ownedRoot);

    const escapedInit = await runScript("init-panel.ts", [
      "--owned-root",
      ownedRoot,
      join(caseRoot, "outside"),
      "--name",
      "Escaped",
    ]);
    expect(escapedInit.code).toBe(1);
    expect(escapedInit.stderr).toContain("path escapes the panel workspace");

    const initialized = await runScript("init-panel.ts", [
      "--owned-root",
      ownedRoot,
      workspace,
      "--name",
      "Fixture Buyer Panel",
    ]);
    expect(initialized.code).toBe(0);
    expect(initialized.stdout).toContain("initialized draft panel");

    const draft = await runScript("validate-panel.ts", [
      workspace,
      "--allow-draft",
    ]);
    expect(draft.code).toBe(0);
    expect(draft.stdout).toContain("WARNING seat-count");

    // Re-skinned to the book-roll domain 2026-08-12 during the kit workout. This
    // fixture arrived verbatim from the parent marketing panel and carried two
    // defects: generic marketing seat ids in an insurance kit's own spine test,
    // and only ONE dissent seat, so the suite's happy path asserted a panel the
    // kit's prose says must not validate. Both dissent seats are present now.
    const seats = [
      {
        id: "tenured-personal-lines-loyalist",
        name: "Marguerite, thirty-one years with the agency",
        kind: "buyer",
        fit: "core",
        dossier: "dossiers/tenured-personal-lines-loyalist.md",
        decision_signal:
          "Calls the office rather than quietly requesting a quote elsewhere.",
        active: true,
      },
      {
        id: "office-manager-who-handles-the-mail",
        name: "Denise, who opens the commercial mail",
        kind: "user",
        fit: "core",
        dossier: "dossiers/office-manager-who-handles-the-mail.md",
        decision_signal:
          "Puts the letter in front of the owner instead of filing it.",
        active: true,
      },
      {
        id: "recent-claim-client",
        name: "Rob, wind claim on the roof last spring",
        kind: "buyer",
        fit: "core",
        dossier: "dossiers/recent-claim-client.md",
        decision_signal:
          "Calls to ask what changed rather than assuming the increase is retaliation.",
        active: true,
      },
      {
        id: "referring-accountant",
        name: "Paul, who sends the agency his clients",
        kind: "influencer",
        fit: "adjacent",
        dossier: "dossiers/referring-accountant.md",
        decision_signal:
          "Refers the next client to this agency after seeing the letter.",
        active: true,
      },
      {
        id: "already-leaving-regardless",
        name: "Pat, whose house is under contract",
        kind: "buyer",
        fit: "hard-no",
        dossier: "dossiers/already-leaving-regardless.md",
        decision_signal:
          "Declines regardless of how the letter reads, because the decision predates it.",
        active: true,
      },
      {
        id: "wrong-cross-sell-target",
        name: "Joanne, pitched a landlord policy on her own home",
        kind: "buyer",
        fit: "wrong-fit",
        dossier: "dossiers/wrong-cross-sell-target.md",
        decision_signal:
          "Declines an offer that genuinely does not suit her situation; a yes here is a failure.",
        active: true,
      },
      {
        id: "compliance-and-claims-reviewer",
        name: "Compliance and claims reviewer",
        kind: "specialist",
        fit: "adjacent",
        dossier: "dossiers/compliance-and-claims-reviewer.md",
        decision_signal:
          "Flags statements the agency cannot support in writing before the letter is mailed.",
        active: true,
      },
    ];
    const manifestPath = join(workspace, "panel.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    Object.assign(manifest.panel, {
      objective:
        "Assess whether policyholders in the mailed cohort would call the office about this renewal letter.",
      decision_signal:
        "Inform the agency whether to mail this letter as written, revise it, or hold it.",
      artifact_types: ["renewal-letter"],
      status: "ready",
      review_due: "2027-01-01",
      calibration_outcome: "Inbound calls referencing the letter",
      calibration_horizon: "14 days after publication",
    });
    manifest.scoring.dimensions = [
      { id: "core-fit", label: "Core customer fit", weight: 40 },
      { id: "trust", label: "Trust and credibility", weight: 35 },
      { id: "action", label: "Action likelihood", weight: 25 },
    ];
    manifest.seats = seats.map((seat) => ({ ...seat }));
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    await writeFile(
      join(workspace, "owner", "OWNER-CONTEXT.md"),
      "# Owner Context\n\nA truthful fixture owner context with a controlled workflow offer.\n",
    );
    await writeFile(
      join(workspace, "evidence", "SOURCE-NOTES.md"),
      "# Source Notes\n\n- Source: fixture interview set with decision-relevant observations.\n",
    );
    for (const seat of seats) {
      await writeFile(
        join(workspace, seat.dossier),
        dossier(seat.id, seat.name),
      );
    }

    const strict = await runScript("validate-panel.ts", [workspace]);
    expect(strict.code).toBe(0);
    expect(strict.stdout).toContain("PASS: no validation issues");

    manifest.seats[1].dossier = manifest.seats[0].dossier;
    await writeFile(manifestPath, JSON.stringify(manifest));
    const duplicateDossier = await runScript("validate-panel.ts", [workspace]);
    expect(duplicateDossier.code).toBe(1);
    expect(duplicateDossier.stdout).toContain("duplicate-dossier");
    manifest.seats[1].dossier = seats[1].dossier;

    await writeFile(
      join(workspace, seats[1].dossier),
      dossier(seats[1].id, seats[1].name, true),
    );
    await writeFile(manifestPath, JSON.stringify(manifest));
    const filler = await runScript("validate-panel.ts", [workspace]);
    expect(filler.code).toBe(1);
    expect(filler.stdout).toContain("dossier-filler");
    await writeFile(
      join(workspace, seats[1].dossier),
      dossier(seats[1].id, seats[1].name),
    );

    await writeFile(
      join(workspace, seats[2].dossier),
      await readFile(join(workspace, seats[0].dossier), "utf8"),
    );
    const similar = await runScript("validate-panel.ts", [workspace]);
    expect(similar.code).toBe(1);
    expect(similar.stdout).toContain("dossier-similarity");
    await writeFile(
      join(workspace, seats[2].dossier),
      dossier(seats[2].id, seats[2].name),
    );

    manifest.scoring.dimensions = [null];
    await writeFile(manifestPath, JSON.stringify(manifest));
    const malformed = await runScript("validate-panel.ts", [workspace]);
    expect(malformed.code).toBe(1);
    expect(malformed.stdout).toContain("dimension-shape");
    manifest.scoring.dimensions = [
      { id: "core-fit", label: "Core customer fit", weight: 40 },
      { id: "trust", label: "Trust and credibility", weight: 35 },
      { id: "action", label: "Action likelihood", weight: 25 },
    ];
    await writeFile(manifestPath, JSON.stringify(manifest));

    const external = join(caseRoot, "external.md");
    await writeFile(external, "external support content");
    await symlink(external, join(workspace, "owner", "escape.md"));
    manifest.panel.owner_context = "owner/escape.md";
    await writeFile(manifestPath, JSON.stringify(manifest));
    const escapedSupport = await runScript("validate-panel.ts", [workspace]);
    expect(escapedSupport.code).toBe(1);
    expect(escapedSupport.stdout).toContain("unsafe-path");
    manifest.panel.owner_context = "owner/OWNER-CONTEXT.md";
    await writeFile(manifestPath, JSON.stringify(manifest));

    const artifactPath = join(workspace, "inputs", "fixture-page.md");
    await writeFile(
      artifactPath,
      "# Workflow Review\n\n~~~~~~\n\nWe help operations teams find one controlled workflow improvement.",
    );
    const prepared = await runScript("prepare-run.ts", [
      workspace,
      artifactPath,
      "--slug",
      "fixture",
    ]);
    expect(prepared.code).toBe(0);
    const runDir = prepared.stdout.match(/^prepared run:\s*(.+)$/m)?.[1];
    expect(runDir).toBeTruthy();
    if (!runDir) throw new Error("prepare-run did not report its run folder");
    const runPath = join(runDir, "RUN.json");
    const snapshotPath = join(runDir, "panel-snapshot.json");
    const run = JSON.parse(await readFile(runPath, "utf8"));
    expect(JSON.stringify(run)).not.toContain(artifactPath);
    expect(run.artifact_sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(run.panel_snapshot_sha256).toMatch(/^[a-f0-9]{64}$/);
    const task = await readFile(
      join(runDir, "tasks", "tenured-personal-lines-loyalist.md"),
      "utf8",
    );
    expect(task).toContain(
      "Role-specific decision signal: Calls the office rather than quietly requesting a quote elsewhere.",
    );
    expect(task).toContain("~~~~~~~text");
    const copiedArtifact = await readFile(
      join(runDir, run.artifact_file),
      "utf8",
    );
    expect(task).toContain(copiedArtifact);
    await writeFile(
      artifactPath,
      "MUTABLE SOURCE CONTENT MUST NOT ENTER THE TASK",
    );
    expect(task).not.toContain(
      "MUTABLE SOURCE CONTENT MUST NOT ENTER THE TASK",
    );

    run.artifact_file = "../panel-snapshot.json";
    await writeFile(runPath, JSON.stringify(run));
    const hostileRun = await runScript("validate-run.ts", [
      runDir,
      "--prepared",
    ]);
    expect(hostileRun.code).toBe(1);
    expect(hostileRun.stdout).toContain("artifact-path");
    run.artifact_file = run.artifact_label;
    await writeFile(runPath, JSON.stringify(run));
    const preparedValidation = await runScript("validate-run.ts", [
      runDir,
      "--prepared",
    ]);
    expect(preparedValidation.code).toBe(0);

    const snapshot = JSON.parse(
      await readFile(snapshotPath, "utf8"),
    ) as SnapshotFixture;
    const validButChangedSnapshot = structuredClone(snapshot);
    validButChangedSnapshot.panel.name = "Changed Snapshot Name";
    await writeFile(snapshotPath, JSON.stringify(validButChangedSnapshot));
    const changedSnapshot = await runScript("validate-run.ts", [
      runDir,
      "--prepared",
    ]);
    expect(changedSnapshot.code).toBe(1);
    expect(changedSnapshot.stdout).toContain("snapshot-hash");
    await writeFile(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`);
    const expectPreparedRejection = async (
      mutate: (candidate: SnapshotFixture) => void,
      code: string,
    ): Promise<void> => {
      const candidate = structuredClone(snapshot);
      mutate(candidate);
      await writeFile(snapshotPath, JSON.stringify(candidate));
      const result = await runScript("validate-run.ts", [runDir, "--prepared"]);
      expect(result.code).toBe(1);
      expect(result.stdout).toContain(code);
      await writeFile(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`);
    };
    await expectPreparedRejection((candidate) => {
      candidate.panel.objective = "";
    }, "snapshot-panel-field");
    await expectPreparedRejection((candidate) => {
      candidate.seats[1].id = "tenured-personal-lines-loyalist";
    }, "snapshot-seat-id");
    await expectPreparedRejection((candidate) => {
      candidate.seats[0].kind = "observer";
    }, "snapshot-seat-kind");
    await expectPreparedRejection((candidate) => {
      candidate.seats[0].fit = "maybe";
    }, "snapshot-seat-fit");
    await expectPreparedRejection((candidate) => {
      candidate.seats[0].decision_signal = "";
    }, "snapshot-decision-signal");
    await expectPreparedRejection((candidate) => {
      for (const seat of candidate.seats)
        seat.fit =
          seat.id === "already-leaving-regardless" ? "hard-no" : "adjacent";
    }, "snapshot-core-coverage");
    await expectPreparedRejection((candidate) => {
      for (const seat of candidate.seats) seat.fit = "core";
    }, "snapshot-dissent-coverage");
    await expectPreparedRejection((candidate) => {
      candidate.scoring.dimensions = candidate.scoring.dimensions.slice(0, 2);
    }, "snapshot-dimension-count");
    await expectPreparedRejection((candidate) => {
      candidate.scoring.dimensions[1].id = "core-fit";
    }, "snapshot-dimension-id");
    await expectPreparedRejection((candidate) => {
      candidate.scoring.dimensions[0].weight = 0;
    }, "snapshot-dimension-weight");
    await expectPreparedRejection((candidate) => {
      candidate.scoring.dimensions[0].weight = 41;
    }, "snapshot-scoring-total");
    await unlink(join(workspace, "owner", "OWNER-CONTEXT.md"));
    await unlink(join(workspace, seats[0].dossier));
    const snapshotOnly = await runScript("validate-run.ts", [
      runDir,
      "--prepared",
    ]);
    expect(snapshotOnly.code).toBe(0);

    for (const seat of seats) {
      if (seat.id !== "referring-accountant") {
        await writeFile(
          join(runDir, "reactions", `${seat.id}.md`),
          reaction(seat),
        );
      }
    }
    run.status = "complete";
    run.execution_mode = "isolated-parallel";
    run.runtime = "fixture";
    run.model = "fixture";
    run.completed_at = new Date().toISOString();
    run.failed_seats = [
      {
        seat_id: "referring-accountant",
        reason: "The first response was malformed after two recorded attempts.",
        attempts: 2,
      },
    ];
    run.retried_seats = [
      {
        seat_id: "referring-accountant",
        reason: "A second task was issued after the malformed first response.",
      },
    ];
    run.degraded_reason =
      "One influencer reaction failed after a retry, so the synthesis excludes that seat.";
    await writeFile(runPath, JSON.stringify(run));
    run.completed_at = "not-a-timestamp";
    await writeFile(runPath, JSON.stringify(run));
    const invalidCompletedAt = await runScript("validate-run.ts", [runDir]);
    expect(invalidCompletedAt.code).toBe(1);
    expect(invalidCompletedAt.stdout).toContain("completed-at");
    run.completed_at = new Date().toISOString();
    run.created_at = new Date(
      Date.parse(run.completed_at) + 1_000,
    ).toISOString();
    await writeFile(runPath, JSON.stringify(run));
    const invalidChronology = await runScript("validate-run.ts", [runDir]);
    expect(invalidChronology.code).toBe(1);
    expect(invalidChronology.stdout).toContain("run-chronology");
    run.created_at = new Date(
      Date.parse(run.completed_at) - 1_000,
    ).toISOString();
    run.run_id = "other-run";
    await writeFile(runPath, JSON.stringify(run));
    const invalidRunId = await runScript("validate-run.ts", [runDir]);
    expect(invalidRunId.code).toBe(1);
    expect(invalidRunId.stdout).toContain("run-id");
    run.run_id = basename(runDir);
    await writeFile(runPath, JSON.stringify(run));
    await writeFile(join(runDir, "SYNTHESIS.md"), synthesisMarkdown());
    await writeFile(join(runDir, "SCORECARD.md"), scorecardMarkdown());
    await writeFile(join(runDir, "RESULT.md"), resultMarkdown());
    await writeFile(join(runDir, "OUTCOME.json"), JSON.stringify(outcome()));
    for (const [suffix, expectedCode] of [
      ["\nDECISION: MAYBE", "reaction-duplicate"],
      ["\nUNKNOWN: This is not a permitted output field.", "reaction-label"],
      ["\nThis unlabelled prose is not allowed.", "reaction-contract"],
      ["\nDECISION: YES definitely", "reaction-contract"],
    ] as const) {
      await writeFile(
        join(runDir, "reactions", "office-manager-who-handles-the-mail.md"),
        `${reaction(seats[1])}${suffix}`,
      );
      const invalidReaction = await runScript("validate-run.ts", [runDir]);
      expect(invalidReaction.code).toBe(1);
      expect(invalidReaction.stdout).toContain(expectedCode);
    }

    await writeFile(
      join(runDir, "reactions", "office-manager-who-handles-the-mail.md"),
      reaction(seats[1]),
    );
    run.execution_provenance = "runtime-attested";
    run.isolation_attestation = {
      provider: "fixture-runtime",
      issued_at: "not-a-timestamp",
      reference: "fixture-runtime-reference",
      run_id: run.run_id,
    };
    await writeFile(runPath, JSON.stringify(run));
    const invalidAttestationTime = await runScript("validate-run.ts", [runDir]);
    expect(invalidAttestationTime.code).toBe(1);
    expect(invalidAttestationTime.stdout).toContain("isolation-attestation");
    run.isolation_attestation.issued_at = new Date().toISOString();
    run.isolation_attestation.run_id = "other-run";
    await writeFile(runPath, JSON.stringify(run));
    const invalidAttestationRun = await runScript("validate-run.ts", [runDir]);
    expect(invalidAttestationRun.code).toBe(1);
    expect(invalidAttestationRun.stdout).toContain("isolation-attestation");
    run.isolation_attestation.run_id = run.run_id;
    run.isolation_attestation.issued_at = new Date(
      Date.parse(run.created_at) - 1_000,
    ).toISOString();
    await writeFile(runPath, JSON.stringify(run));
    const invalidAttestationWindow = await runScript("validate-run.ts", [
      runDir,
    ]);
    expect(invalidAttestationWindow.code).toBe(1);
    expect(invalidAttestationWindow.stdout).toContain("isolation-attestation");
    run.isolation_attestation.issued_at = run.completed_at;
    await writeFile(runPath, JSON.stringify(run));
    const attested = await runScript("validate-run.ts", [runDir]);
    expect(attested.code).toBe(0);
    run.execution_provenance = "operator-recorded";
    run.isolation_attestation = null;
    await writeFile(runPath, JSON.stringify(run));

    const invalidOutcome = outcome();
    (
      invalidOutcome.scorecard as {
        dimensions: Array<{ weighted_contribution: number }>;
      }
    ).dimensions[0].weighted_contribution = 31;
    await writeFile(
      join(runDir, "OUTCOME.json"),
      JSON.stringify(invalidOutcome),
    );
    const arithmetic = await runScript("validate-run.ts", [runDir]);
    expect(arithmetic.code).toBe(1);
    expect(arithmetic.stdout).toContain("score-arithmetic");

    await writeFile(join(runDir, "OUTCOME.json"), JSON.stringify(outcome()));
    for (const [path, content, expectedCode] of [
      ["SYNTHESIS.md", synthesisMarkdown("HIGH"), "markdown-agreement"],
      ["SCORECARD.md", scorecardMarkdown("72"), "markdown-agreement"],
      ["RESULT.md", resultMarkdown("SHIP"), "markdown-agreement"],
      ["RESULT.md", resultMarkdown("REVISE", "HIGH"), "markdown-agreement"],
      [
        "SYNTHESIS.md",
        synthesisMarkdown().replace("## Consequential dissent\n", ""),
        "markdown-section",
      ],
      [
        "SCORECARD.md",
        scorecardMarkdown().replace("## Total\n", ""),
        "markdown-section",
      ],
      [
        "RESULT.md",
        resultMarkdown().replace("## Next experiment\n", ""),
        "markdown-section",
      ],
      [
        "SYNTHESIS.md",
        synthesisMarkdown().replace(
          "SYNTHESIS_CONFIDENCE: MEDIUM",
          "```text\nSYNTHESIS_CONFIDENCE: MEDIUM\n````",
        ),
        "markdown-marker",
      ],
      [
        "SCORECARD.md",
        scorecardMarkdown().replace(
          "SCORECARD_TOTAL: 71.5",
          "~~~~text\nSCORECARD_TOTAL: 71.5\n~~~~~",
        ),
        "markdown-marker",
      ],
      [
        "RESULT.md",
        resultMarkdown().replace(
          "## Next experiment",
          "<!--\n## Next experiment\n-->",
        ),
        "markdown-section",
      ],
    ] as const) {
      await writeFile(join(runDir, path), content);
      const invalidMarkdown = await runScript("validate-run.ts", [runDir]);
      expect(invalidMarkdown.code).toBe(1);
      expect(invalidMarkdown.stdout).toContain(expectedCode);
      await writeFile(join(runDir, "SYNTHESIS.md"), synthesisMarkdown());
      await writeFile(join(runDir, "SCORECARD.md"), scorecardMarkdown());
      await writeFile(join(runDir, "RESULT.md"), resultMarkdown());
    }
    const complete = await runScript("validate-run.ts", [runDir]);
    expect(complete.code).toBe(0);
    expect(complete.stdout).toContain("WARNING unverified-isolation");
  });
});
