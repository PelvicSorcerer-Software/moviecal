# Issue audit checklist

Use this checklist when auditing GitHub issues before implementation. Do not use this document to track whether a specific issue is open or closed.

## What good implementation issues need

- A narrow goal that fits in one PR.
- Acceptance criteria with pass/fail outcomes.
- Verification commands or manual verification steps.
- Links to relevant product, design, and technical docs.
- Explicit out-of-scope notes.
- Security notes for secrets, auth, RLS, calendar tokens, public feeds, and cron endpoints.

## Common problems to fix

- Duplicate CI/testing issues that ask for the same baseline workflow.
- Broad testing issues that combine unit, integration, E2E, and CI work.
- Feature issues marked ready before their dependencies exist.
- Route names in issue bodies that do not match canonical docs.
- Acceptance criteria that require production secrets or live third-party services.

## Recommended audit process

1. Read the implementation plan and recommended issue sequence.
2. Compare open GitHub issues against the sequence.
3. Merge or close duplicate issues where possible.
4. Split oversized issues into focused tasks.
5. Ensure every dispatchable issue has acceptance criteria, verification steps, and relevant docs.
6. Remove readiness labels from issues that are blocked by missing dependencies.
