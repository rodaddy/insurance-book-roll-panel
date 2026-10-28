// Test harness shim: the kit's tests run on plain Node with no test-framework
// dependency, because a buyer must be able to verify this kit with nothing but
// Node installed. Design rule (2026-08-13): kits never require Bun.
//
// `node:test` supplies describe/test/before/after; it does NOT supply a
// Jest-style `expect`, so the five matchers these tests actually use are
// implemented here against `node:assert/strict`. Keep this surface small: if a
// test needs a sixth matcher, add it here rather than reaching for a framework.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

export {
  after as afterAll,
  before as beforeAll,
  describe,
  test,
} from "node:test";

// Where the suite builds and retires its disposable case folders.
//
// The kit ships tests/ inside the sellable package, so the DEFAULT has to be a
// location that exists on a stranger's machine: the operating system's own
// temporary directory. Earlier revisions defaulted to rTech's internal temp
// workspace (an absolute path on one machine), which errored in beforeAll on any
// machine without that volume and leaked rTech's internal layout into a buyer
// artifact.
//
// Both roots are overridable so rTech's own runs keep landing in the configured
// temp workspace instead of the OS temp dir:
//
//   BOOK_ROLL_TEST_SCRATCH_ROOT   where case folders are created
//   BOOK_ROLL_TEST_ARCHIVE_ROOT   where finished case folders are moved
//
// The legacy RTECH_* names still work so existing rTech tooling is unaffected.
// Nothing is ever deleted: afterAll MOVES the case folder into the archive root,
// matching the kit's own archive-never-delete rule.
export function scratchRoot(): string {
  return (
    process.env.BOOK_ROLL_TEST_SCRATCH_ROOT ??
    process.env.RTECH_SCRATCH_ROOT ??
    join(tmpdir(), "insurance-book-roll-panel-tests", "scratch")
  );
}

export function archiveRoot(): string {
  return (
    process.env.BOOK_ROLL_TEST_ARCHIVE_ROOT ??
    process.env.RTECH_ARCHIVE_ROOT ??
    join(tmpdir(), "insurance-book-roll-panel-tests", "archive")
  );
}

interface Matchers {
  toBe(expected: unknown): void;
  toContain(expected: string): void;
  toMatch(expected: RegExp): void;
  toBeTruthy(): void;
  not: Omit<Matchers, "not">;
}

export function expect(actual: any): Matchers {
  return {
    toBe(expected) {
      assert.strictEqual(actual, expected);
    },
    toContain(expected) {
      assert.ok(
        String(actual).includes(expected),
        `expected value to contain ${JSON.stringify(expected)}`,
      );
    },
    toMatch(expected) {
      assert.match(String(actual), expected);
    },
    toBeTruthy() {
      assert.ok(actual);
    },
    not: {
      toBe(expected) {
        assert.notStrictEqual(actual, expected);
      },
      toContain(expected) {
        assert.ok(
          !String(actual).includes(expected),
          `expected value NOT to contain ${JSON.stringify(expected)}`,
        );
      },
      toMatch(expected) {
        assert.doesNotMatch(String(actual), expected);
      },
      toBeTruthy() {
        assert.ok(!actual);
      },
    },
  };
}

export interface CommandResult {
  code: number;
  stdout: string;
  stderr: string;
}

// Replaces Bun.spawn. Resolves with the exit code rather than rejecting, because
// these tests assert on non-zero codes as the expected outcome of a refusal.
export function runCommand(
  command: string[],
  cwd: string,
): Promise<CommandResult> {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command[0], command.slice(1), {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", rejectPromise);
    child.on("close", (code) => {
      resolvePromise({ code: code ?? 0, stdout, stderr });
    });
  });
}
