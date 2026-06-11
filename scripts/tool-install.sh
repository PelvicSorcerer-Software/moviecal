#!/usr/bin/env bash
set -euo pipefail

tools_dir=".codex/tools"
bin_dir="$tools_dir/bin"
supabase_version="2.105.0"
supabase_archive="supabase_${supabase_version}_darwin_arm64.tar.gz"
supabase_url="https://github.com/supabase/cli/releases/download/v${supabase_version}/${supabase_archive}"

mkdir -p "$bin_dir"

echo "Installing workspace-local Vercel CLI..."
npm install --prefix "$tools_dir" vercel

echo "Installing workspace-local Supabase CLI..."
tmp_archive="$(mktemp /tmp/supabase.XXXXXX.tar.gz)"
curl -L "$supabase_url" -o "$tmp_archive"
tar -xzf "$tmp_archive" -C "$bin_dir"
rm -f "$tmp_archive"

if command -v codesign >/dev/null 2>&1; then
  codesign --force --sign - "$bin_dir/supabase" >/dev/null 2>&1 || true
fi

echo "Tool install complete. Run 'npm run tool:check' to verify."
