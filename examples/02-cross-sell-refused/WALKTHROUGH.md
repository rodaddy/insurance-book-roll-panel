# Worked example 2 — the kit refuses, and what happens next

The first example showed a letter being read. This one shows the kit stopping.
It is here because the refusal is the part most people do not expect, and
because seeing it once means you recognize it as the kit working rather than as
something broken.

## What the agency brought

A producer had a renewal letter going out to 120 commercial accounts and wanted
it read before it mailed. Here is what he sent:

---

Dear {{policyholder full name}},

Your business owners policy renews on {{renewal effective date}}. Please note
that your premium is being adjusted this term.

We value your business and appreciate the opportunity to continue serving your
insurance needs. If you have any questions regarding your renewal, please
contact our office at your convenience.

Sincerely,

{{producer name}}
{{agency name}}

---

## What the kit did

It ran the input gate before doing anything else:

```
node scripts/check-letter-input.ts "<workspace>" "inputs/bop-renewal.md"
```

And it stopped:

```
REFUSED: this letter is not ready to read back through the book.

[R3 change-without-number-or-reason]
  What we could use: your letter tells the policyholder their premium or rate is changing
  What we could not: how much or why - the letter never says it, and we will not put a figure or a cause in your mouth
  The one question:  Add the amount or percentage and the reason, or tell us plainly that you are choosing to leave it out and we will run it as written and let the seats react to the omission.

Nothing here has been guessed at or filled in for you. Answer the
question above and run this again.
```

Exit code 1. No panel ran, no score was produced, nothing was written.

That transcript is the script's real output, captured from this exact letter and
a filled-in book profile, not a reconstruction of it.

## What the AI said to the producer

Close to verbatim from the refusal, because that text is written for him:

> I am going to stop before we run this one.
>
> Your letter tells 120 business owners their premium is being adjusted, and it
> never says by how much or why. I could run the panel anyway, but I would be
> guessing at the number and the reason, and every reaction you got back would
> be a reaction to my guess instead of to your letter.
>
> Two ways forward, both fine. Give me the amount or the percentage and the
> reason, and we will read it properly. Or tell me you are leaving them out on
> purpose, and we will run it exactly as written so you can see what that
> omission costs you. What I will not do is fill them in.

## What the producer said

That the increase averaged 14 percent, driven by a carrier reunderwriting of the
contractor class, and that he had left it vague deliberately because he did not
want to put 14 percent in writing to people who would land between 6 and 22.

**That is a real answer and a defensible one.** It is also exactly the situation
the second option exists for.

## What happened then

He chose to run it as written. The AI reran the deterministic gate with:

```
node scripts/check-letter-input.ts "<workspace>" "inputs/bop-renewal.md" --confirmed-omit-premium-context
```

The pass receipt recorded the explicit omission; the script did not infer the
choice from the conversation. The panel then read the omission. The result, in
one line: eight of thirteen seats assumed the worst available number.

The contractor seat, whose renewal had jumped the year before, reacted to
"adjusted" by assuming another double-digit increase and said he would put it
out to bid before calling. The restaurant owner read "adjusted" as a word chosen
to avoid saying a number, which he found more alarming than a number. The
office manager filed it as routine because nothing in it looked urgent, and it
surfaced eleven days later.

The finding was not that the letter needed better words. It was that vagueness
chosen to avoid alarming people had reliably alarmed them more, and that a range
("most accounts will see between 6 and 12 percent; yours is {{renewal premium
amount}}") did the job he actually wanted.

## The point

The refusal did not stop the work. It took ninety seconds, and it stopped the
kit from producing a confident report about a premium figure nobody had
supplied.

A kit that runs on anything you give it will always produce something. This one
tells you when what you gave it is not good enough — which is the only reason to
believe it when it says a letter is fine.
