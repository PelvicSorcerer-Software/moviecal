Testing strategy

- Unit tests for core business logic (e.g., UID generation, feed event mapping).
- Integration tests for API endpoints (watchlist, feed generation) using test DB fixtures.
- End-to-end tests for primary flows (search -> add to watchlist -> generate feed) with Playwright/Cypress.
- CI gates: lint, typecheck, unit + integration tests before merging.
- Test data: avoid real user data in test artifacts.
