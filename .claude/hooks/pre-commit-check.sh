#!/usr/bin/env bash
# PreToolUse gate on `git commit`: prettier -> build -> lint -> test with
# 100% coverage. Blocks the commit (and re-stages prettier's fixes) on any
# failure so Claude has to resolve it -- including adding tests -- before
# the commit can go through.
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

input="$(cat)"
cmd="$(printf '%s' "$input" | jq -r '.tool_input.command // empty')"

# Only gate commands that actually invoke `git commit` (including chained
# commands like `git add -A && git commit -m "..."`).
if ! printf '%s' "$cmd" | grep -qE '(^|[;&|])[[:space:]]*git[[:space:]]+commit([[:space:]]|$)'; then
  exit 0
fi

cd "$REPO_ROOT" || exit 1

deny() {
  local reason="$1"
  jq -n --arg reason "$reason" \
    '{hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: $reason}}'
  exit 0
}

branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
if [ "$branch" = "main" ] || [ "$branch" = "master" ]; then
  deny "Direct commits to '$branch' are blocked. Create a feature branch and open a PR instead -- use the ship-pr skill (Skill tool, skill: \"ship-pr\")."
fi

export NVM_DIR="$HOME/.nvm"
# shellcheck disable=SC1091
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use >/dev/null 2>&1

run_step() {
  local desc="$1"
  shift
  local log
  if ! log="$("$@" 2>&1)"; then
    deny "$(printf 'Pre-commit check failed at: %s\n\n%s\n\nFix the issue (add tests to reach 100%% coverage if this was a coverage failure) and retry the commit.' "$desc" "$log")"
  fi
}

run_step "prettier" pnpm format
# Re-stage anything prettier reformatted so the commit includes the fixed content.
git add -u
run_step "build" pnpm build
run_step "lint" pnpm lint
run_step "test + 100% coverage" pnpm test:cov

exit 0
