// check-letter-input.ts — the kit's REFUSAL GATE.
//
// KIT-STANDARD §4.9 requires every kit to name at least one condition under
// which it STOPS and tells the user their input is not good enough, and
// requires that condition to be a check a script can make rather than a vibe
// the AI is asked to have. This script is that check. The AI drives the
// conversation; this decides.
//
// It answers three questions about a letter the agency is about to mail:
//   R1  Is there a real letter at all, and is it the agency's own?
//   R2  Does the workspace carry a filled-in book profile to draw seats from?
//   R3  Does the letter announce a premium change without a number or a reason?
//
// Any of those refuses the wash. A refusal prints, in the agency's own words,
// what could be read, what could not, and the ONE question that unblocks it.
// It never invents a premium number, a carrier, a date, or a book statistic.
//
// EXIT GRAMMAR: 0 = the letter may proceed to a wash (warnings may print).
//               1 = REFUSED; the reasons and the unblocking question are on
//                   stdout for the AI to read back to the agency verbatim.
//               2 = usage error.
//               3 = harness error (unreadable path, etc.).

import { readFile, stat } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";

const MINIMUM_LETTER_WORDS = 40;

interface Refusal {
  code: string;
  couldRead: string;
  couldNotRead: string;
  question: string;
}

function usage(): never {
  console.error(
    "usage: node check-letter-input.ts <workspace> <letter-path> [--confirmed-omit-premium-context]",
  );
  process.exit(2);
}

function harness(message: string): never {
  console.error(`ERROR harness: ${message}`);
  process.exit(3);
}

function isWithin(root: string, candidate: string): boolean {
  const fromRoot = relative(root, candidate);
  return (
    fromRoot !== ".." &&
    !fromRoot.startsWith(`..${sep}`) &&
    !isAbsolute(fromRoot)
  );
}

function words(text: string): number {
  return text.split(/\s+/).filter((token) => token.length > 0).length;
}

// R3 pattern tables. The gate fires when a letter SAYS the premium is moving and
// then declines to say by how much or why. A letter that never mentions a change
// is not caught here, and should not be.
//
// The verb list deliberately includes the SOFT phrasings, not just the blunt
// ones. Observed 2026-08-12 during the kit workout, on a carrier-roll letter
// whose entire premium disclosure was "Your premium under the new carrier is
// different from what you have been paying": the first verb list caught only
// increase/adjust/change/rise/higher, so that sentence passed clean and the gate
// printed "no unexplained premium change was found." An agency softening bad
// news is the NORMAL case, not the edge case - "different from", "not the same
// as", "no longer", "revised", "updated", and "new premium" are how the letter
// that most needs this gate is actually written.
const CHANGE_VERB =
  "increase|increases|increased|increasing|adjust|adjusts|adjusted|adjusting|change|changes|changed|changing|rise|risen|rising|go(?:ing)? up|went up|higher|different|differs|revis(?:e|es|ed|ion)|updat(?:e|es|ed)|new|no longer the same|not the same|mov(?:e|es|ed|ing)";
const CHANGE_CLAIM = new RegExp(
  `\\b(premium|premiums|rate|rates|pricing|cost|costs)\\b[^.!?\\n]{0,80}\\b(${CHANGE_VERB})\\b` +
    `|\\b(${CHANGE_VERB})\\b[^.!?\\n]{0,40}\\b(to your (?:premium|rate)|in your (?:premium|rate)|(?:your )?(?:premium|rate))\\b`,
  "i",
);

// A number the policyholder can act on: a dollar figure, a percentage, or a
// spelled-out placeholder field the merge will fill. Comma-grouped and bare
// dollar amounts count too - "an increase of 1,240 dollars" states a magnitude
// just as plainly as "$1,240" and was missed by the first pattern.
const HAS_NUMBER =
  /\$\s?\d|\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\s?(?:%|percent|dollars)\b|\{\{[^}]*(?:premium|amount|percent|increase|rate)[^}]*\}\}/i;

// A stated cause. Insurance letters that land give one; letters that do not
// generate the call the agency did not want.
//
// This is searched ONLY inside the sentences that carry the change claim, never
// across the whole letter. Observed 2026-08-12 in the same workout: a letter
// that said "this is not about you, your home, or your claims history" satisfied
// the whole-letter reason search on the words "claims history" - a sentence
// DENYING a reason was read as supplying one. A cause counts when it is attached
// to the change, not when the words merely appear somewhere on the page.
const HAS_REASON =
  /\b(because|due to|driven by|as a result of|reflect(?:s|ing)?|attributabl|owing to|stems? from|the result of)\b|\b(claims? (?:experience|history|activity)|loss (?:experience|history|ratio)|storm|weather|catastrophe|reinsurance|inflation|repair costs?|construction costs?|medical costs?|carrier[- ]wide|statewide|filed rate|rate filing|territory|coverage (?:change|update)|limits? (?:change|increase)|deductible)\b/i;

// A reason cannot be supplied by a sentence that DENIES it. These are the
// standard reassurance lines in a carrier-roll letter, and every one of them
// names a cause only to rule it out.
const REASON_DENIAL =
  /\b(not|nothing|never|no)\b[^.!?\n]{0,60}\b(because|due to|about|related to|reflect|result of|caused by)\b|\bis not (?:a )?(?:decision|reflection|result)\b|\bhas nothing to do with\b/i;

// A change ANNOUNCED to this policyholder is not the same as a possibility
// raised about other people, and only the first owes a number.
//
// Observed 2026-08-12, workout round 3: a genuinely good non-renewal notice from
// a personal-lines agency was REFUSED because it said "some households in your
// situation end up with a higher premium and a different wind deductible." That
// sentence is hedged, it is about other households, and the letter's whole point
// was refusing to promise a figure the agency did not have - "we are not going
// to tell you it will be the same, because we do not know that." R3 demanded a
// number for a change nobody announced, which is the gate punishing an agency
// for the exact honesty the kit praises everywhere else.
//
// A sentence is hedged when it is conditional or speaks about a group rather
// than this reader. A sentence that says YOUR premium is doing something is not
// hedged, even if a hedging word appears elsewhere in it.
const HEDGED_CLAIM =
  /\b(some|many|most|certain|a few|other) (?:households?|clients?|customers?|policyholders?|accounts?|people|families|homes?)\b|\b(may|might|could|can|would|possibly|potentially|in some cases|depending on|if )\b/i;
const ADDRESSED_TO_READER =
  /\byour (?:premium|rate|policy|renewal|coverage|account)\b|\byou (?:will|are|have) (?:be|been )?(?:paying|charged|seeing)\b/i;

function announcesAChange(sentence: string): boolean {
  if (!CHANGE_CLAIM.test(sentence)) return false;
  if (ADDRESSED_TO_READER.test(sentence)) return true;
  return !HEDGED_CLAIM.test(sentence);
}

// Split into sentences so the reason test can be scoped to the claim.
function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0);
}

// A reason counts only when it sits in a sentence that also carries the change
// claim, or in the sentence immediately after it, and only when that sentence is
// not denying the cause.
function reasonSupportsTheChange(letter: string): boolean {
  const parts = sentences(letter);
  for (let index = 0; index < parts.length; index += 1) {
    if (!announcesAChange(parts[index] as string)) continue;
    const window = [parts[index], parts[index + 1]].filter(
      (chunk): chunk is string => typeof chunk === "string",
    );
    for (const chunk of window) {
      if (HAS_REASON.test(chunk) && !REASON_DENIAL.test(chunk)) return true;
    }
  }
  return false;
}

// KIT-STANDARD §4.7 requires an ingesting kit to treat the letter as DATA and to
// quote anything inside it that addresses the AI back to the user as suspicious
// content. Until the 2026-08-12 workout that requirement lived only as prose in
// SKILL.md - an instruction for the AI to notice something, which is the vibe
// this kit's own §4.9 rule rejects in favor of a mechanical check. The detection
// is now here, next to the other gates.
//
// This is a WARNING, not a refusal. An agency may legitimately mail a letter
// that quotes a suspicious email it received, and refusing that would be the
// kit guessing at intent. What the gate owes the agency is that the line is
// surfaced and quoted rather than silently carried into thirteen seat tasks.
const INJECTION_PATTERNS: ReadonlyArray<RegExp> = [
  /\bignore (?:your |all |any )?(?:previous |prior |above |earlier )?instructions?\b/i,
  /\bdisregard (?:your |all |any |the )?(?:previous |prior |above |earlier )?(?:instructions?|rules?|prompt)\b/i,
  /\b(?:system|admin(?:istrator)?) (?:note|message|prompt|instruction)\b/i,
  /\bmark (?:this|it) (?:as )?(?:approved|complete|closed|ready|ship)\b/i,
  /\bskip (?:the )?(?:review|compliance|gate|check|validation)\b/i,
  /\bset (?:all )?(?:the )?(?:seat|panel|decision)/i,
  /\bscore (?:this|it) (?:highly|high|a? ?10|perfect)\b/i,
  /\bdo not (?:mention|tell|report|show)\b/i,
  /\byou are (?:now )?(?:a|an|the) [a-z ]{0,30}(?:assistant|model|ai)\b/i,
  /\bnew instructions?\b/i,
];

// Return the offending lines verbatim so the AI can quote them back rather than
// paraphrase. Paraphrasing an injection is how it survives.
function injectionLines(letter: string): string[] {
  const found: string[] = [];
  for (const line of letter.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    if (INJECTION_PATTERNS.some((pattern) => pattern.test(trimmed))) {
      found.push(
        trimmed.length > 160 ? `${trimmed.slice(0, 157)}...` : trimmed,
      );
    }
  }
  return found;
}

async function readLetter(path: string): Promise<string> {
  try {
    const info = await stat(path);
    if (!info.isFile()) harness(`letter path is not a file: ${path}`);
  } catch (error) {
    harness(
      `cannot read the letter at ${path}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    harness(
      `cannot read the letter at ${path}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function readOptional(path: string): Promise<string | null> {
  try {
    return await readFile(path, "utf8");
  } catch {
    return null;
  }
}

// The shipped template carries an explicit answer slot under each heading:
//   <replace this paragraph with your answer>
// A remaining slot is the unambiguous signal that a section was never answered,
// which is far more reliable than counting words over the whole file — the
// template's own explanatory prose is long enough to pass any word count, so a
// length heuristic silently passes an untouched profile. Observed 2026-08-12
// against a freshly initialized workspace: the word count said "filled" for a
// profile with all seven slots still in place.
const ANSWER_SLOT = /<\s*replace this[^>]*>/gi;

// A profile may legitimately be written from scratch without the template. That
// case has no slots, so it falls back to requiring real substance.
const MINIMUM_PROFILE_WORDS = 60;

// The three sections the seats genuinely cannot be built without, and the
// minimum an answer to one of them has to be before it counts as an answer.
// Twelve words is a low bar on purpose - "rough is fine" is the kit's own
// promise - but it is above the length of every evasion below.
const REQUIRED_SECTIONS = [
  "Lines we write",
  "How the book splits",
  "Client shapes we see most",
];
const MINIMUM_SECTION_WORDS = 12;

// Non-answers. An agency writing "n/a" under "what lines do you write" has
// technically replaced the slot and supplied nothing, and R2 exists precisely so
// the seats are not thirteen generic strangers. Observed 2026-08-12 in the kit
// workout, round 2: a profile whose seven answers were "n/a", "not sure", "tbd",
// "see above", "ask Dennis", "we don't track that", and "standard stuff" - 14
// words of answer in total - passed the gate, because with the slots gone the
// check fell back to counting words across the whole file and the SHIPPED
// TEMPLATE'S OWN QUESTION PROSE supplies 467 of them. The gate was measuring the
// template, not the agency.
//
// "We do not know" is deliberately NOT on this list. The template explicitly
// invites it ("write that you do not know it rather than filling in a figure"),
// and an agency saying so about ONE section while answering the others honestly
// is exactly the behavior the kit wants. What is refused is a profile where the
// load-bearing sections carry nothing at all.
const NON_ANSWER =
  /^(?:n\/?a|na|none|tbd|to be determined|not sure|unsure|unknown|\?+|see above|same as above|standard(?: stuff)?|the usual|ask \w+|we don'?t track (?:that|this)|no idea|skip(?:ped)?|later)[.!]?$/i;

interface ProfileState {
  filled: boolean;
  unansweredSlots: number;
  emptySections: string[];
}

// Pull the prose written UNDER a heading, excluding the heading itself, the
// template's own bullet prompts, and any leftover angle-bracket markers.
//
// Lines that came from the SHIPPED TEMPLATE are subtracted, because the template
// states each question as an explanatory paragraph rather than a bullet, and
// position alone cannot tell that paragraph apart from an answer. Comparing
// against the shipped text can: a line the agency did not write is not an answer
// the agency gave. `templateLines` is the set of non-blank lines in the shipped
// book-profile.md; when it is unavailable the check degrades to length only,
// which is the pre-existing behavior rather than a silent pass.
function sectionBody(
  text: string,
  heading: string,
  templateLines: Set<string>,
): string {
  const lines = text.split("\n");
  const start = lines.findIndex(
    (line) =>
      /^#{1,6}\s/.test(line) &&
      line.replace(/^#{1,6}\s*/, "").trim() === heading,
  );
  if (start === -1) return "";
  const body: string[] = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index] as string;
    if (/^#{1,6}\s/.test(line)) break;
    if (/^\s*(?:-|\*)\s/.test(line)) continue; // template's illustrative bullets
    if (templateLines.has(line.trim())) continue; // the shipped question itself
    body.push(line);
  }
  return body
    .join(" ")
    .replace(/\{\{[^}]*\}\}/g, " ")
    .replace(/<[^>]*>/g, " ")
    .trim();
}

// The shipped template, read from this skill folder. Everything a skill READS
// lives inside the installed skill folder (KIT-STANDARD §4.5), so this resolves
// skill-relative and is correct by construction.
async function shippedTemplateLines(): Promise<Set<string>> {
  const template = resolve(
    import.meta.dirname,
    "..",
    "assets",
    "workspace-template",
    "book-profile.md",
  );
  const text = await readOptional(template);
  if (text === null) return new Set<string>();
  return new Set(
    text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("#")),
  );
}

function bookProfileState(
  text: string | null,
  templateLines: Set<string>,
): ProfileState {
  if (text === null)
    return { filled: false, unansweredSlots: 0, emptySections: [] };

  const unansweredSlots = (text.match(ANSWER_SLOT) ?? []).length;
  if (unansweredSlots > 0)
    return { filled: false, unansweredSlots, emptySections: [] };

  // Template shape: judge each load-bearing section on its OWN answer.
  const present = REQUIRED_SECTIONS.filter((heading) =>
    new RegExp(`^#{1,6}\\s*${heading}\\s*$`, "im").test(text),
  );
  if (present.length > 0) {
    const emptySections = present.filter((heading) => {
      const body = sectionBody(text, heading, templateLines);
      return (
        words(body) < MINIMUM_SECTION_WORDS || NON_ANSWER.test(body.trim())
      );
    });
    return {
      filled: emptySections.length === 0,
      unansweredSlots: 0,
      emptySections,
    };
  }

  // Written from scratch without the template headings: require real substance.
  const body = text
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("#"))
    .filter(
      (line) =>
        !/^\s*(?:-|\*)\s*(?:Describe|State|List|Replace|Answer|Example)\b/i.test(
          line,
        ),
    )
    .join(" ")
    .replace(/\{\{[^}]*\}\}/g, " ")
    .replace(/<[^>]*>/g, " ");
  return {
    filled: words(body) >= MINIMUM_PROFILE_WORDS,
    unansweredSlots: 0,
    emptySections: [],
  };
}

function report(refusals: Refusal[]): void {
  console.log(
    "REFUSED: this letter is not ready to read back through the book.",
  );
  console.log("");
  for (const refusal of refusals) {
    console.log(`[${refusal.code}]`);
    console.log(`  What we could use: ${refusal.couldRead}`);
    console.log(`  What we could not: ${refusal.couldNotRead}`);
    console.log(`  The one question:  ${refusal.question}`);
    console.log("");
  }
  console.log(
    "Nothing here has been guessed at or filled in for you. Answer the",
  );
  console.log("question above and run this again.");
}

async function main(): Promise<void> {
  const confirmationFlag = "--confirmed-omit-premium-context";
  const argv = process.argv.slice(2);
  const confirmedOmitPremiumContext = argv.includes(confirmationFlag);
  const positional = argv.filter((value) => value !== confirmationFlag);
  if (positional.some((value) => value.startsWith("--"))) usage();
  const [workspaceArgument, letterArgument, ...extra] = positional;
  if (!workspaceArgument || !letterArgument || extra.length > 0) usage();

  const workspace = resolve(workspaceArgument);
  const letterPath = resolve(letterArgument);
  const refusals: Refusal[] = [];
  let omissionConfirmed = false;

  // R1 — the agency's own letter, not a shipped example and not a stub.
  const letter = await readLetter(letterPath);
  const letterWords = words(letter);
  const examplesMarker = `${sep}examples${sep}`;
  const insideExamples = letterPath.includes(examplesMarker);
  const insideTemplate = letterPath.includes(
    `${sep}assets${sep}workspace-template${sep}`,
  );

  if (insideExamples || insideTemplate) {
    refusals.push({
      code: "R1 not-your-letter",
      couldRead: `a letter at ${letterPath}, which is one of the worked examples that ship with this kit`,
      couldNotRead:
        "anything about YOUR book - the examples exist to show you the flow before you risk your own mailing, and a panel run on them tells you nothing about the letter you are about to send",
      question:
        "Paste or point us at the actual letter you are about to mail, even if it is a rough draft.",
    });
  } else if (letterWords < MINIMUM_LETTER_WORDS) {
    refusals.push({
      code: "R1 letter-too-thin",
      couldRead: `${letterWords} word${letterWords === 1 ? "" : "s"} at ${letterPath}`,
      couldNotRead:
        "a letter a policyholder could actually receive - there is not enough here for thirteen people to react to",
      question:
        "Send the full letter as it will go out, including the opening line and whatever you are asking the client to do.",
    });
  }

  // R2 — a filled-in book profile. Without it the seats are generic.
  if (!isWithin(workspace, resolve(workspace, "book-profile.md"))) {
    harness("workspace path resolution failed for book-profile.md");
  }
  const bookProfile = await readOptional(resolve(workspace, "book-profile.md"));
  const profile = bookProfileState(bookProfile, await shippedTemplateLines());
  if (!profile.filled) {
    refusals.push({
      code: "R2 no-book-profile",
      couldRead:
        bookProfile === null
          ? "no book profile at all in this panel workspace"
          : profile.unansweredSlots > 0
            ? `a book profile with ${profile.unansweredSlots} section${profile.unansweredSlots === 1 ? "" : "s"} still unanswered - the "replace this paragraph with your answer" lines are still there`
            : profile.emptySections.length > 0
              ? `a book profile where the section${profile.emptySections.length === 1 ? "" : "s"} we most need - ${profile.emptySections.join(", ")} - ${profile.emptySections.length === 1 ? "has" : "have"} nothing written under ${profile.emptySections.length === 1 ? "it" : "them"} yet, or only a placeholder like "n/a" or "not sure"`
              : "a book profile that still holds only the questions we shipped, with no answers written in",
      couldNotRead:
        "which client shapes your book actually carries - personal versus commercial, which lines you write, who your long-tenure clients are. Seats built without that are thirteen generic strangers, and their reactions would not be about your book",
      question:
        "Fill in book-profile.md: what lines you write, roughly how the book splits, and the four or five client shapes you see most. Rough is fine; invented is not.",
    });
  }

  // §4.7 — text inside the letter that addresses the AI rather than the client.
  const warnings: string[] = [];
  const injected = injectionLines(letter);
  if (injected.length > 0) {
    warnings.push(
      `This letter contains ${injected.length} line${injected.length === 1 ? "" : "s"} that speak${injected.length === 1 ? "s" : ""} to the assistant rather than to your policyholder. Nothing in ${injected.length === 1 ? "it" : "them"} has been acted on - the letter is data here, never instructions - but read ${injected.length === 1 ? "it" : "them"} yourself before mailing, because ${injected.length === 1 ? "it is" : "they are"} going out to your book exactly as written:\n` +
        injected.map((line) => `    > ${line}`).join("\n"),
    );
  }
  // R3 fires on an ANNOUNCED change only - see announcesAChange().
  if (sentences(letter).some(announcesAChange)) {
    const hasNumber = HAS_NUMBER.test(letter);
    const hasReason = reasonSupportsTheChange(letter);

    // A magnitude supplied ONLY as an unfilled merge field is not a refusal -
    // the wash workflow requires stripping the real figure to a field, so
    // demanding a literal number here would refuse every correctly-prepared
    // letter. It is still worth saying out loud: the seats read what is on the
    // page, and thirteen people reacting to "{{renewal premium amount}}" cannot
    // tell the agency whether the actual number lands.
    const literalNumber =
      /\$\s?\d|\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\s?(?:%|percent|dollars)\b/i.test(
        letter,
      );
    if (hasNumber && !literalNumber) {
      warnings.push(
        "The only figure in this letter is an unfilled merge field. The seats can react to the fact that a number is coming, but not to its size - if the increase is steep, tell the seats roughly how steep by leaving a representative figure in this copy.",
      );
    }

    if (!hasNumber || !hasReason) {
      const missing = [
        !hasNumber ? "how much" : null,
        !hasReason ? "why" : null,
      ]
        .filter((item): item is string => item !== null)
        .join(" or ");
      if (confirmedOmitPremiumContext) {
        omissionConfirmed = true;
        warnings.push(
          `The agency explicitly confirmed that this letter deliberately omits ${missing}. The gate did not invent or add anything; the panel will react to the omission exactly as written.`,
        );
      } else {
        refusals.push({
          code: "R3 change-without-number-or-reason",
          couldRead:
            "your letter tells the policyholder their premium or rate is changing",
          couldNotRead: `${missing} - the letter never says it, and we will not put a figure or a cause in your mouth`,
          question:
            "Add the amount or percentage and the reason, or explicitly confirm the omission and rerun with --confirmed-omit-premium-context so the seats react to the letter exactly as written.",
        });
      }
    }
  }

  if (refusals.length > 0) {
    // Warnings print on the refusal path too. An injected line inside a letter
    // that is ALSO refused for a missing number would otherwise never be
    // surfaced, and it is still going out to the book once the refusal is
    // answered.
    for (const warning of warnings) {
      console.log(`WARNING: ${warning}`);
    }
    if (warnings.length > 0) console.log("");
    report(refusals);
    process.exit(1);
  }

  for (const warning of warnings) {
    console.log(`WARNING: ${warning}`);
  }
  if (warnings.length > 0) console.log("");

  console.log(
    `PASS letter-input: ${letterPath} (${letterWords} words) may proceed to a wash.`,
  );
  console.log(
    omissionConfirmed
      ? "The book profile is filled in and the agency explicitly confirmed the premium-context omission."
      : "The book profile is filled in and no unexplained premium change was found.",
  );
  console.log(
    "This checks the INPUT only. It says nothing about whether the letter is any good.",
  );
}

main().catch((error: unknown) => {
  harness(error instanceof Error ? error.message : String(error));
});
