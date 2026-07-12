---
name: ship-pr
description: Ship the current changes as a PR instead of committing to main. Creates a feature branch, commits with a Conventional Commits message, pushes, and opens a GitHub PR with a generated body (summary + test plan). Use whenever you're about to commit work in this repo -- direct commits to main/master are blocked by the pre-commit hook.
---

# Ship as a PR

This repo blocks direct commits to `main`/`master` (see `.claude/hooks/pre-commit-check.sh`).
Use this flow instead of committing straight to main.

## Steps

1. **Check current branch.** Run `git branch --show-current`. If it's `main` or
   `master`, you need to create a new branch (step 2). If already on a
   feature branch, skip to step 3.

2. **Create a branch.** Name it `<type>/<kebab-case-summary>`, where `<type>`
   is one of the Conventional Commits types this repo's commitlint config
   accepts: `feat`, `fix`, `chore`, `docs`, `refactor`, `perf`, `test`,
   `build`, `ci`, `style`, `revert`. Pick the type that matches the change
   (e.g. `feat/add-coverage-gate`, `fix/backend-cors-headers`).

   ```
   git checkout -b <type>/<kebab-case-summary>
   ```

3. **Review what's changing.** Run `git status` and `git diff` (staged and
   unstaged) so the commit and PR body reflect what's actually there, not
   assumptions. Stage the relevant files deliberately (avoid blind
   `git add -A` if there's unrelated clutter).

4. **Commit with a Conventional Commits message.** Subject line format:
   `<type>(<optional-scope>): <summary>`, imperative mood, no trailing
   period, under ~72 chars. This repo's `commit-msg` hook (Husky +
   commitlint) will reject anything that doesn't conform -- if it does,
   fix the message and retry rather than bypassing with `--no-verify`.
   The pre-commit hook will also run prettier/build/lint/test:cov and
   block the commit if any of those fail.

   ```
   git commit -m "$(cat <<'EOF'
   <type>(<scope>): <summary>

   <body -- the "why", not a restatement of the diff>
   EOF
   )"
   ```

5. **Push the branch.**

   ```
   git push -u origin <type>/<kebab-case-summary>
   ```

6. **Open the PR.** Use `gh pr create` with a HEREDOC body. Build the
   summary from the actual commits/diff on this branch (`git log
   main..HEAD` and `git diff main...HEAD --stat`), not from memory of the
   conversation.

   ```
   gh pr create --title "<type>(<scope>): <summary>" --body "$(cat <<'EOF'
   ## Summary
   - <bullet per meaningful change, why not just what>

   ## Test plan
   - [ ] <how this was/should be verified>
   EOF
   )"
   ```

7. **Report the PR URL** back to the user. Don't merge it yourself unless
   explicitly asked.

## Notes

- If `gh` isn't installed/authenticated, say so explicitly rather than
  silently skipping PR creation -- push the branch and give the user the
  compare URL instead.
- Follow the repo's general git safety rules: never force-push, never
  skip hooks (`--no-verify`) to get past a failing check, only commit
  when the user has actually asked for the work to be committed.
- If the pending changes are logically more than one PR's worth (e.g.
  unrelated features mixed together), say so and propose splitting
  rather than shipping one large PR.
