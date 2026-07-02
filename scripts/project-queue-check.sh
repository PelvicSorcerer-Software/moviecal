#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
# shellcheck source=lib/project-queue-common.sh
source "$repo_root/scripts/lib/project-queue-common.sh"

mode="${PROJECT_QUEUE_MODE:-post-cutover}"
project_items_fixture="${PROJECT_QUEUE_ITEMS_JSON:-}"
open_issues_fixture="${PROJECT_QUEUE_OPEN_ISSUES_JSON:-}"

project_queue_require_jq

if [ "$mode" != "post-cutover" ]; then
  echo "Unsupported PROJECT_QUEUE_MODE: $mode" >&2
  echo "Project queue checks use post-cutover mode only." >&2
  exit 1
fi

if [ -n "$project_items_fixture" ] || [ -n "$open_issues_fixture" ]; then
  project_queue_load_fixture_state
  project_queue_print_context "$mode" "yes"
else
  project_queue_load_live_state
  project_queue_print_context "$mode" "no"
fi

project_queue_validate_post_cutover
