---
name: gh-stack
description: >
  Work safely with `gh stack` (the github/gh-stack CLI extension for
  stacked PRs) — checking out a stack, rebasing it onto trunk,
  resolving conflicts without silently losing work, and submitting.
  Use whenever the user mentions gh stack, stacked PRs, restacking a
  branch chain, or asks to rebase/resolve conflicts/submit a stack.
---

# gh-stack

`gh stack` manages a chain of branches, each one a PR that builds on
the previous (`trunk <- branch1 <- branch2 <- ...`). The whole chain
rebases and pushes together. The dangerous part isn't the commands —
it's that a stack rebase can *silently* replay an old, already-merged
commit and produce a file that looks resolved but has quietly thrown
away real work. This skill exists mainly to stop that.

## mental model

- Each branch in the stack is one commit (or a few) on top of the
  previous branch, which is on top of the previous, down to trunk.
- `gh stack rebase` walks the stack bottom-to-top, rebasing each
  branch onto its (possibly-updated) parent in turn. A branch whose
  PR is already merged gets skipped, not replayed.
- Conflicts happen when a lower branch's PR merged with content that
  diverged from what a higher branch's commit still expects — e.g.
  someone (you, an earlier session) changed the same file after the
  higher branch's commit was written.
- `gh stack submit` pushes every branch and creates/updates one PR
  per branch, chained via base branches.

## command reference

```
gh stack init [branch1 branch2 ...]   # start a stack from existing branches
gh stack checkout <num|PR#|URL|name>  # import/switch to a stack
gh stack view                         # show the current stack + PR status
gh stack add <branch>                 # add a new branch on top
gh stack rebase [--continue|--abort]  # rebase the whole stack onto trunk
gh stack submit                       # push + create/update all PRs
gh stack sync                         # pull remote state into local
gh stack push                         # push active branches without full submit
gh stack merge                        # merge the stack's PRs
gh stack unstack                      # remove stack tracking, local + GitHub
gh stack modify                       # interactively restructure
gh stack link                         # link existing PRs into a stack, no local tracking
```

`gh stack checkout <number>` is the normal entry point when picking
up a stack you (or the user) started earlier — it re-imports all
branches from GitHub and switches to the tip.

## the workflow

```
gh stack checkout <stack-number>   # get the stack locally, tip checked out
gh stack rebase                    # restack everything onto trunk
#  ...resolve any conflicts (see below)...
gh stack rebase --continue
#  ...full-surface verification (see below)...
gh stack submit
#  ...confirm mergeability (see below)...
```

**First-run caveat:** `gh stack rebase` may prompt interactively
("Enable git rerere to remember conflict resolutions?"). That prompt
blocks on stdin — if you're driving this from a non-interactive
shell, either let the user run the first invocation themselves once,
or check `gh stack rebase --help` for a flag that skips the prompt
before assuming one exists.

## resolving conflicts — do this every time, not just when it looks conflicted

`gh stack rebase` reports conflicts per file and tells you to fix
them, `git add`, then `gh stack rebase --continue`. Before touching
any conflict marker, run this check — it catches the failure mode
that actually loses work:

### 1. Is the commit being replayed already fully in trunk?

```bash
git merge-base --is-ancestor <picked-commit-sha> <onto-sha> && echo ANCESTOR
```

If it's an ancestor, the pick contributes **nothing new** — any
conflict in it should resolve to trunk's content, full stop. Confirm
with a diff before trusting that, though:

```bash
diff <(git show <picked-commit-sha>:<file>) <(git show <onto-sha>:<file>) \
  | grep '^<' | grep -v '^< *$'
```

If that's empty (or only trivial whitespace), trunk's version is
strictly newer — resolve every conflicted file from that pick the
same way:

```bash
git show <onto-sha>:"<file>" > "<file>"
git add "<file>"
```

**Why this matters:** in this exact failure mode, `git`/rerere had
already *silently* staged some of the conflicted files with no
conflict markers at all — but the staged content was the *old*,
already-superseded version, not trunk's. `git status` shows a plain
`M`, not `AA`/`UU`, so it looks resolved. It isn't. Always run the
ancestor check above on **every** file the rebase touched in a pick,
including ones git didn't flag as conflicted, whenever the commit
being replayed is old enough to plausibly be already-merged content.
Compare the staged blob hash (`git status --porcelain=v2` shows it)
against `git show <onto-sha>:<file>` — if a "clean" file's staged
blob doesn't match trunk's, it silently reverted real work.

### 2. If it's a genuine conflict (not an ancestor, or the diff shows real unique content)

Two independent branches actually diverged on the same code — e.g.
one branch added a new file that references a constant another
branch renamed, or two branches each added logic for the same rule.
Don't blindly pick a side:

- Read both versions' *intent*, not just their diff.
- If both changes are real and compatible, **compose** them (e.g. two
  independent caps on the same value → take `min()` of both, with a
  comment explaining why both exist) rather than discarding either.
- If one clearly supersedes the other (a bugfix on top of stale
  logic), keep the superseding version but re-check every call site
  the discarded version's API shape touched.

### 3. Clean merges can still be broken — check the whole surface, not just conflicted files

A file that's *new* in the branch being rebased won't conflict at
all even if it references something a lower branch renamed or
removed — git has nothing to compare it against, so it merges
silently and compiles wrong. After every conflict is resolved:

```bash
grep -rn "<old-name>" <package-or-app-root>   # anything still referencing the old API?
```

Then, before `--continue` (or right after, before `submit`):

```bash
git status --porcelain=v2                     # confirm zero remaining "u" (unmerged) lines
<typecheck command for the whole workspace>    # not just the touched package
<lint command>
<full test suite>                              # not just tests in touched files
```

Run these across the **whole workspace**, not just the package that
had conflicts — a rename in one package can silently break an
unrelated consumer that never showed up as a conflict.

### 4. `gh stack rebase --continue`

Only after the checks above. If something's still wrong, fix and
re-run the verification before continuing — `--continue` moves the
rebase forward per-pick and you don't get an easy second look at a
pick once you're past it.

## after a fix surfaces mid-rebase

If full-surface verification finds a real bug (not a resolution
artifact — an actual logic error the rebase exposed, e.g. two
independently-correct pieces of code that are individually fine but
inconsistent once combined), fix it as its own small commit rather
than folding it into the conflict resolution silently. Ask whether
it belongs as a separate commit on the stack tip or amended into the
commit whose own logic it's fixing — don't assume.

## submitting

```bash
gh stack submit
```

Pushes every branch and opens/updates one PR per branch. After it
reports success, don't just trust the CLI output — confirm on
GitHub's side:

```bash
gh pr view <branch> --json number,title,url,mergeable
```

for every branch in the stack. `mergeable: "MERGEABLE"` on all of
them is the actual confirmation that the rebase didn't leave anything
in a bad state relative to trunk.

## gotchas

- **`gh stack rebase --abort`** exists and is safe — use it if a
  resolution attempt goes sideways rather than trying to hand-repair
  a half-resolved rebase.
- **Merged branches are skipped automatically** (`gh stack rebase`
  prints `✓ Skipping <branch> (PR #N merged)`) — don't manually
  re-resolve conflicts for a branch the tool already skipped past.
- **A branch reported "rebased ... (adjusted for merged PR)"** means
  the tool detected its original parent PR merged and retargeted it
  — expected, not an error.
- **`git rerere` recording is a double-edged sword.** It speeds up
  re-resolving the *same* conflict across repeated rebase attempts,
  but it can also replay a resolution recorded from an earlier,
  now-outdated attempt without telling you. Treat any suspiciously
  fast/silent resolution during a stack rebase as something to verify
  with the ancestor check above, not something to trust by default.
