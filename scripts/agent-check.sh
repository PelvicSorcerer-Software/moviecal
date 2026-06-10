#!/usr/bin/env bash
set -euo pipefail
repo="PelvicSorcerer/moviecal"
if ! gh auth status >/dev/null 2>&1; then
  echo "gh CLI not authenticated. Please run 'gh auth login' before running this script." >&2
  exit 1
fi
default_branch=$(gh repo view "$repo" --json defaultBranchRef --jq .defaultBranchRef.name)
echo "Repository: $repo (default branch: $default_branch)"
echo "Listing open issues labeled 'agent-ready'..."
issues_json=$(gh issue list --repo "$repo" --label agent-ready --state open --json number,title,body,labels,milestone)
count=$(echo "$issues_json" | jq length)
if [ "$count" -eq 0 ]; then
  echo "No open agent-ready issues found."
  exit 0
fi

echo "Found $count agent-ready issues. Checking each..."
echo "$issues_json" | jq -c '.[]' | while read -r issue; do
  num=$(echo "$issue" | jq -r .number)
  title=$(echo "$issue" | jq -r .title)
  echo "\nIssue #$num - $title"
  body=$(echo "$issue" | jq -r .body)
  if ! echo "$body" | grep -iq "Acceptance criteria" || ! echo "$body" | grep -iq "Verification"; then
    echo " - MISSING Acceptance criteria or Verification command. Posting comment and skipping."
    gh issue comment "$num" --repo "$repo" --body "Automated check: this issue is labeled 'agent-ready' but lacks clear Acceptance criteria and/or Verification steps. Please add them before an automated agent starts work." || true
    continue
  fi
  echo " - OK: has Acceptance & Verification"
done

exit 0
