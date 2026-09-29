#!/usr/bin/env bash
# Runs every migration on a throwaway local Postgres (with a mock of Supabase's auth schema,
# roles and realtime publication), then acts out the rules as different users through RLS.
# Needs a local Postgres you can reach with `psql`/`createdb`. Usage: supabase/tests/run.sh
set -euo pipefail
cd "$(dirname "$0")/.."
DB=sprout_test
dropdb --if-exists "$DB" && createdb "$DB"
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f tests/mock_supabase.sql 2>&1 | grep -v 'wal_level\|HINT' || true
for f in migrations/*.sql; do psql -q -v ON_ERROR_STOP=1 -d "$DB" -f "$f" >/dev/null && echo "applied $(basename "$f")"; done
out=$(psql -q -d "$DB" -f tests/behaviour.sql 2>&1)
echo "$out" | grep -E '^(PASS|FAIL|---)|ERROR'
dropdb "$DB"
! echo "$out" | grep -qE '^FAIL|ERROR'
