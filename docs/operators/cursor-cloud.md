# Cursor Cloud Agent operator notes

## Scope

This doc covers what's specific to Cursor Cloud Agents when they develop this repo. Read `AGENTS.md` first for the generic contract that applies to every platform.

## What's verified vs assumed

Everything below marked "verified" was actually run against this repo on a real Cursor Cloud Agent VM (Ubuntu/x86_64) in a prior session, not just inferred from Cursor's documentation.

## Bootstrap / environment config

- `.cursor/environment.json` defines the Cursor Cloud Agent environment for this repo. It runs on a generic Ubuntu/x86_64 VM and is independent of the `.codex/environments` profile, which targets Codex Desktop on macOS.
- Its install script copies `.env.example` to `.env.local` when missing and runs `npm install`. It does not run `.codex/scripts/check-worker-environment.sh`; that script is part of the Codex worker/orchestrator worktree contract (`docs/operators/codex.md`), not the Cursor Cloud Agent contract.

## Tool availability quirks

- `npm run tool:install` works on Cursor Cloud Agent VMs (verified on Ubuntu/x86_64): it detects OS/arch and downloads the matching Supabase CLI release.
- Docker is not present on the default Cursor Cloud Agent VM, so `supabase db lint --local` and any workflow that needs a local Supabase/Postgres stack will not work here either. Use the `supabase-verify` GitHub Actions workflow, or run `npm run db:lint` with a disposable `SUPABASE_DB_URL`.
- Unlike the Codex sandbox caveats in `docs/operators/codex.md`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, and `npm run e2e` (including its automatic `playwright install chromium` step) have been verified to run without elevated execution and without extra system packages on the default Cursor Cloud Agent VM.
- `gh` is preauthenticated on Cursor Cloud Agent VMs and does not have the macOS keychain visibility issue described for Codex.
- This VM's default Node version (22.x at verification time) does not match the `24` pinned in `.nvmrc`/`package.json`'s `engines` field and used by CI. Nothing failed functionally on Node 22 in the verified session, but this is an unresolved alignment gap — see Phase 4 in `docs/planning/agent-environment-compatibility-plan.md`.

## Branch convention

- `cursor/<slug>-<run-id>`, assigned by the Cursor platform, not chosen by the agent. See `docs/operators/branch-and-ci-conventions.md` for the full cross-platform table.

## Queue governance

- The Codex orchestrator/worker contract (`spawn_agent`, worktree provisioning, `BOOT_CHECKPOINT`/`STARTUP_CHECKPOINT` gates — see `docs/operators/codex.md` and `docs/planning/agent-orchestration.md`) is specific to Codex's multi-agent tooling and does not apply to Cursor Cloud Agents, which run as a single agent per task/PR with no equivalent orchestrator step.
- Whether Cursor Cloud Agents may pick up `agent-ready` queue issues directly is an open policy decision, not yet resolved (see Phase 5 in `docs/planning/agent-environment-compatibility-plan.md`). Until that decision is made, treat a Cursor Cloud Agent as following this repo's general branch/PR/verification rules on whatever task it is given, without assuming it may consume the single `agent-ready` issue.

## Secrets

For real (disposable/dev-only) Supabase, TMDb, and cron-secret values, prefer the Secrets tab in Cursor Dashboard → Cloud Agents over editing `.env.local` by hand. Secrets are injected as process environment variables, which Next.js reads at build and runtime even without a matching `.env.local` entry; use the exact variable names from `.env.example`.

## Known gaps / follow-ups

- Node version alignment with CI (see Phase 4 in the compatibility plan).
- Whether Cursor Cloud Agents should ever consume `agent-ready` directly (Phase 5).
