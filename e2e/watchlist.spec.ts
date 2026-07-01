import { expect, test } from './test-fixtures';

test('unauthenticated visitors are redirected away from protected app pages', async ({
  assertRedirectsToSignIn,
}) => {
  await assertRedirectsToSignIn('/watchlist');
  await assertRedirectsToSignIn('/settings/calendar');
});

test('stubbed sign-in reaches the intended protected route without live credentials', async ({
  page,
  signInAsTestUser,
}) => {
  await signInAsTestUser('/settings/calendar');

  await expect(page).toHaveURL('/settings/calendar');
  await expect(
    page.getByRole('heading', { name: 'Calendar settings' }),
  ).toBeVisible();
  await expect(page.getByRole('main').getByText('e2e@example.com')).toBeVisible();
});

test('seeded authenticated sessions can open protected app pages directly', async ({
  page,
  seedAuthenticatedSession,
}) => {
  await seedAuthenticatedSession();

  await page.goto('/watchlist');

  await expect(page.getByText('Signed in as')).toContainText('e2e@example.com');
  await expect(page.getByRole('heading', { name: 'Your watchlist is empty' })).toBeVisible();

  await page.goto('/settings/calendar');
  await expect(
    page.getByRole('heading', { name: 'Calendar settings' }),
  ).toBeVisible();
  await expect(page.getByRole('main').getByText('e2e@example.com')).toBeVisible();
});

test('seeded watchlist fixtures can be removed deterministically', async ({
  page,
  seedAuthenticatedSession,
}) => {
  await seedAuthenticatedSession([603]);
  await page.goto('/watchlist');

  await expect(page.getByRole('heading', { name: 'The Matrix' })).toBeVisible();
  await page.getByRole('button', { name: 'Remove' }).click();

  await expect(
    page.getByText('Removed The Matrix from My watchlist.'),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Your watchlist is empty' })).toBeVisible();
});

test('authorized users can open a shared watchlist detail page and only see that target', async ({
  page,
  seedAuthenticatedSession,
}) => {
  await seedAuthenticatedSession({
    personalTmdbIds: [603],
    sharedWatchlists: [
      {
        id: 'e2e-shared-watchlist-1',
        name: 'Friday movie night',
        tmdbIds: [27205],
      },
    ],
  });
  await page.goto('/watchlist/e2e-shared-watchlist-1');

  await expect(
    page.getByRole('heading', { level: 2, name: 'Friday movie night' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Inception' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'The Matrix' })).toHaveCount(0);
});

test('removing a movie from one watchlist target does not remove it from another target', async ({
  page,
  seedAuthenticatedSession,
}) => {
  await seedAuthenticatedSession({
    personalTmdbIds: [603],
    sharedWatchlists: [
      {
        id: 'e2e-shared-watchlist-1',
        name: 'Friday movie night',
        tmdbIds: [603],
      },
    ],
  });
  await page.goto('/watchlist/e2e-shared-watchlist-1');
  await page.getByRole('button', { name: 'Remove' }).click();

  await expect(
    page.getByText('Removed The Matrix from Friday movie night.'),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'This watchlist is empty' })).toBeVisible();

  await page.goto('/watchlist');
  await expect(page.getByRole('heading', { name: 'The Matrix' })).toBeVisible();
});

test('read-only shared memberships hide mutation affordances on the detail page', async ({
  page,
  seedAuthenticatedSession,
}) => {
  await seedAuthenticatedSession({
    sharedWatchlists: [
      {
        canEdit: false,
        id: 'e2e-shared-watchlist-readonly',
        name: 'Curated picks',
        tmdbIds: [27205],
      },
    ],
  });
  await page.goto('/watchlist/e2e-shared-watchlist-readonly');

  await expect(page.getByText('Read-only access')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Remove' })).toHaveCount(0);
});

test('authenticated users can create a shared watchlist from the overview', async ({
  page,
  seedAuthenticatedSession,
}) => {
  await seedAuthenticatedSession();
  await page.goto('/watchlist');

  await page.getByLabel('Watchlist name').fill('Friday movie night');
  await page.getByRole('button', { name: 'Create shared watchlist' }).click();

  await expect(
    page.getByText('Created shared watchlist Friday movie night.'),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Friday movie night' }),
  ).toBeVisible();
});

test('authenticated users can open calendar settings', async ({
  page,
  seedAuthenticatedSession,
}) => {
  await seedAuthenticatedSession();
  await page.goto('/settings/calendar');

  await expect(
    page.getByRole('heading', { name: 'Calendar settings' }),
  ).toBeVisible();
  await expect(page.getByRole('main').getByText('e2e@example.com')).toBeVisible();
});
