import { defineConfig } from 'vitest/config';

// Default credentials for a local `supabase start` instance.
// These are the well-known Supabase CLI demo-project values — safe to include
// in the repository because they only work against a locally running stack.
// Override any of these by setting the corresponding environment variable
// before running `npm run lane:real-stack`.
const LOCAL_SUPABASE_URL = 'http://127.0.0.1:54321';
const LOCAL_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
  '.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9' +
  '.CRFA0NiK7urOoD9bMOmaIFl8MSDeNe5fmjn9nZLR7U';
const LOCAL_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
  '.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0' +
  '.EGIM96RAZx35lJzdJsyH-qQwv8Hj04zWl196z2-SBc0';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Real-stack tests follow the *.real-stack.test.ts naming convention so
    // they are excluded from the unit lane (vitest.unit.config.ts) and are
    // only executed by this config when `npm run lane:real-stack` is run.
    include: ['test/**/*.real-stack.test.ts'],
    // Inject local Supabase defaults so tests can connect to a `supabase start`
    // stack without requiring the caller to set env vars manually.
    env: {
      NEXT_PUBLIC_SUPABASE_URL:
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? LOCAL_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? LOCAL_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY:
        process.env.SUPABASE_SERVICE_ROLE_KEY ?? LOCAL_SERVICE_ROLE_KEY,
    },
  },
});
