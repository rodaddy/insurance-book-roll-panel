import {
  afterAll,
  archiveRoot,
  beforeAll,
  describe,
  expect,
  runCommand,
  scratchRoot,
  test,
} from "./harness.ts";
import {
  chmod,
  cp,
  mkdtemp,
  mkdir,
  readdir,
  readFile,
  rename,
  stat,
  writeFile,
} from "node:fs/promises";
import { basename, join, resolve } from "node:path";

const KIT_ROOT = resolve(import.meta.dirname, "..");
const SOURCE_PAYLOAD = join(KIT_ROOT, "skills", "insurance-book-roll-panel");

let caseRoot = "";
let installedRoot = "";
// A second, untouched copy of the payload. The customized copy below is what the
// lifecycle tests drive; this one stays byte-identical to the source so the
// documented PRISTINE receipt (verify-copied-install.ts) is actually exercised
// rather than asserted in the changelog.
let pristineRoot = "";

beforeAll(async () => {
  await mkdir(scratchRoot(), { recursive: true });
  caseRoot = await mkdtemp(join(scratchRoot(), "book-roll-room-"));

  pristineRoot = join(caseRoot, "pristine-skill");
  await cp(SOURCE_PAYLOAD, pristineRoot, { recursive: true });

  installedRoot = join(caseRoot, "installed-skill");
  await cp(SOURCE_PAYLOAD, installedRoot, { recursive: true });
  const configPath = join(installedRoot, "USER-CONFIG.md");
  const config = await readFile(configPath, "utf8");
  await writeFile(
    configPath,
    config.replace(
      /- panel workspace location:.*$/m,
      `- panel workspace location: ${join(caseRoot, "agency-workspace")}`,
    ),
    "utf8",
  );
  await mkdir(join(installedRoot, "branding"), { recursive: true });
  await writeFile(
    join(installedRoot, "branding", "brand.md"),
    "# Test agency brand\n",
    "utf8",
  );
});

afterAll(async () => {
  if (!caseRoot) return;
  await mkdir(archiveRoot(), { recursive: true });
  await rename(
    caseRoot,
    join(archiveRoot(), `${basename(caseRoot)}-${Date.now()}`),
  );
});

async function room(...args: string[]) {
  return runCommand(["/bin/bash", "scripts/room.sh", ...args], installedRoot);
}

function roomsRoot(): string {
  return join(caseRoot, "agency-workspace", "rooms");
}

// Read the version rather than hardcoding it, so a version bump cannot leave a
// receipt assertion silently checking last release's string.
async function kitVersion(): Promise<string> {
  return (await readFile(join(KIT_ROOT, "VERSION"), "utf8")).trim();
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

describe("installed room lifecycle", () => {
  test("package and install receipts stay on one version", async () => {
    const version = (await readFile(join(KIT_ROOT, "VERSION"), "utf8")).trim();
    const manifest = JSON.parse(
      await readFile(join(KIT_ROOT, "kit.json"), "utf8"),
    );
    const packageManifest = JSON.parse(
      await readFile(join(KIT_ROOT, "package.json"), "utf8"),
    );
    const metadata = JSON.parse(
      await readFile(join(SOURCE_PAYLOAD, "KIT-METADATA.json"), "utf8"),
    );
    expect(version).toBe(manifest.version);
    expect(version).toBe(packageManifest.version);
    expect(version).toBe(metadata.version);
    const payloadPackage = JSON.parse(
      await readFile(join(SOURCE_PAYLOAD, "package.json"), "utf8"),
    );
    expect(version).toBe(payloadPackage.version);
    expect(payloadPackage.type).toBe("module");
    expect(manifest.requirements.runtimes[0].version).toBe(">=22.18.0");
    for (const command of manifest.verification.commands) {
      expect(command.argv[0]).toBe("node");
      expect(command.argv).not.toContain("--experimental-strip-types");
    }
    for (const path of [
      "README.md",
      "INSTALL.md",
      "installer.md",
      "ACCEPTANCE.md",
    ]) {
      expect(await readFile(join(KIT_ROOT, path), "utf8")).toContain(version);
    }
    expect(
      await readFile(
        join(SOURCE_PAYLOAD, "scripts", "verify-install.ts"),
        "utf8",
      ),
    ).toContain(`const VERSION = "${version}"`);
    expect(await readFile(join(KIT_ROOT, "INSTALL.md"), "utf8")).toContain(
      `PASS insurance-book-roll-panel@${version}`,
    );
  });

  test("the copied payload declares ESM so plain node runs its scripts standalone", async () => {
    // The payload is copied AWAY from the kit root, so the kit root's
    // package.json is no longer an ancestor. Without a package.json of its own
    // declaring "type": "module", node treats every .ts script as CommonJS and
    // the documented buyer commands die with
    // `SyntaxError: Cannot use import statement outside a module`.
    const manifest = JSON.parse(
      await readFile(join(pristineRoot, "package.json"), "utf8"),
    );
    expect(manifest.type).toBe("module");

    // Exit 2 is the scripts' own usage code: reaching it proves the module
    // loaded. A packaging failure exits 1 before any argument parsing.
    const gate = await runCommand(
      ["node", "scripts/check-letter-input.ts"],
      pristineRoot,
    );
    expect(gate.code).toBe(2);
    expect(gate.stderr).toContain("usage: node check-letter-input.ts");
    expect(gate.stderr).not.toContain(
      "Cannot use import statement outside a module",
    );
  });

  test("a pristine copied payload passes source-side equality before any customization", async () => {
    const result = await runCommand(
      ["node", "verify-copied-install.ts", pristineRoot],
      KIT_ROOT,
    );
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("PASS copied-install equality verified");
  });

  test("a pristine copied payload passes installed integrity verification", async () => {
    const result = await runCommand(
      ["node", "scripts/verify-install.ts"],
      pristineRoot,
    );
    expect(result.code).toBe(0);
    expect(result.stdout).toContain(
      `PASS insurance-book-roll-panel@${await kitVersion()}`,
    );
  });

  test("installed verification permits buyer config and branding while guarding immutable files", async () => {
    const result = await runCommand(
      ["node", "scripts/verify-install.ts"],
      installedRoot,
    );
    expect(result.code).toBe(0);
    expect(result.stdout).toContain(
      `PASS insurance-book-roll-panel@${await kitVersion()}`,
    );
  });

  test("runs from the copied skill payload and uses the configured agency workspace", async () => {
    const result = await room("room", "list");
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("No rooms yet");
    expect(await pathExists(join(installedRoot, "rooms"))).toBe(false);
  });

  test("refuses when the script is launched while standing in a different kit", async () => {
    const other = join(caseRoot, "other-kit");
    await mkdir(join(other, "scripts"), { recursive: true });
    await writeFile(
      join(other, "SKILL.md"),
      "---\nname: another-panel\n---\n",
      "utf8",
    );
    await cp(
      join(installedRoot, "scripts", "room.sh"),
      join(other, "scripts", "room.sh"),
    );
    const result = await runCommand(
      ["/bin/bash", join(installedRoot, "scripts", "room.sh"), "room", "list"],
      other,
    );
    expect(result.code).toBe(3);
    expect(result.stderr).toContain("not inside insurance-book-roll-panel");
  });

  test("a failed draft-room copy leaves the requested room name retryable", async () => {
    const brief = join(
      installedRoot,
      "assets",
      "workspace-template",
      "PANEL-BRIEF.md",
    );
    await chmod(brief, 0o000);
    const failed = await room("room", "new", "brand-new");
    await chmod(brief, 0o644);
    expect(failed.code).toBe(3);
    expect(await pathExists(join(roomsRoot(), "brand-new"))).toBe(false);

    // The partial copy is RETIRED to the archive, not left in _staging. `room
    // list` filters _staging out, so anything stranded there is invisible litter
    // that accumulates one folder per failure and is never cleaned. Archiving
    // keeps the kit's archive-never-delete rule while leaving _staging empty.
    expect(failed.stderr).toContain("retired the partial staging folder");
    const staging = join(roomsRoot(), "_staging");
    const stranded = (await pathExists(staging))
      ? (await readdir(staging)).filter((entry) =>
          entry.startsWith("room-new-"),
        )
      : [];
    expect(stranded.length).toBe(0);

    const archived = (await readdir(join(roomsRoot(), "_archive"))).length;
    expect(archived > 0).toBe(true);
  });

  test("room new creates an initialized draft that does not need init-panel to recreate it", async () => {
    const created = await room("room", "new", "brand-new");
    expect(created.code).toBe(0);
    expect(created.stdout).toContain('Draft room "brand-new" created');

    const manifest = await readFile(
      join(roomsRoot(), "brand-new", "panel.json"),
      "utf8",
    );
    expect(manifest).toContain('"id": "brand-new"');
    expect(manifest).not.toContain("__PANEL_ID__");
    const brief = await readFile(
      join(roomsRoot(), "brand-new", "PANEL-BRIEF.md"),
      "utf8",
    );
    expect(brief).not.toContain("PANEL_NAME");
    expect(brief).not.toContain("CREATED_AT");
    expect(brief).toContain("# brand-new");

    const listed = await room("room", "list");
    expect(listed.code).toBe(0);
    expect(listed.stdout).toContain("brand-new");
    expect(listed.stdout).toContain("no active seats");
  });
});
