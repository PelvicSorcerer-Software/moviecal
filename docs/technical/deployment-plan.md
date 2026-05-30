Deployment plan (high level)

- CI: run lint, typecheck, tests on PRs via GitHub Actions.
- Staging: deploy to a staging environment for manual QA.
- Production: promote from staging after smoke tests and approvals.
- Environment variables: store secrets in the host's secret store (e.g., GitHub Actions secrets, cloud secret manager).
- Rollback: use simple rollback strategies (previous release artifact) and monitor errors after deploy.
