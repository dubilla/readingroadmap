/**
 * One-time data migration: Supabase → Neon
 *
 * Reads your data from Supabase via its REST API (using the service role key,
 * which bypasses RLS) and inserts it into Neon using your new user ID.
 *
 * Prerequisites:
 *   1. PR 2 is deployed and you've registered your account on the live site.
 *   2. You have the following values:
 *      - OLD_USER_ID:           Your Supabase user UUID
 *                               (Supabase dashboard → Authentication → Users)
 *      - NEW_USER_ID:           Your new Neon user UUID
 *                               (run: SELECT id FROM users WHERE email = 'you@example.com'
 *                                in Neon console, or npx drizzle-kit studio)
 *      - SUPABASE_URL:          e.g. https://xxxx.supabase.co
 *                               (Supabase dashboard → Settings → API)
 *      - SUPABASE_SERVICE_KEY:  The service_role key (not the anon key)
 *                               (Supabase dashboard → Settings → API)
 *      - DATABASE_URL:          Your Neon connection string
 *
 * Usage:
 *   OLD_USER_ID=... \
 *   NEW_USER_ID=... \
 *   SUPABASE_URL=https://xxxx.supabase.co \
 *   SUPABASE_SERVICE_KEY=... \
 *   DATABASE_URL=... \
 *   npx tsx scripts/migrate-data.ts
 */

import { neon } from '@neondatabase/serverless'

const {
  OLD_USER_ID,
  NEW_USER_ID,
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
  DATABASE_URL,
} = process.env

function assertEnv() {
  const missing = ['OLD_USER_ID', 'NEW_USER_ID', 'SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'DATABASE_URL']
    .filter(k => !process.env[k])
  if (missing.length) {
    console.error('Missing required env vars:', missing.join(', '))
    process.exit(1)
  }
}

async function fetchFromSupabase<T>(table: string): Promise<T[]> {
  const url = `${SUPABASE_URL}/rest/v1/${table}?user_id=eq.${OLD_USER_ID}&select=*`
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_SERVICE_KEY!,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY!}`,
    },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Failed to fetch ${table} (${res.status}): ${body}`)
  }
  return res.json()
}

async function main() {
  assertEnv()
  const sql = neon(DATABASE_URL!)

  // ── 1. user_lanes ──────────────────────────────────────────────────────────
  const lanes = await fetchFromSupabase<any>('user_lanes')
  console.log(`Migrating ${lanes.length} lanes...`)
  for (const lane of lanes) {
    await sql`
      INSERT INTO user_lanes (id, name, user_id, "order")
      VALUES (${lane.id}, ${lane.name}, ${NEW_USER_ID}, ${lane.order})
    `
  }

  // ── 2. swimlanes ───────────────────────────────────────────────────────────
  const swims = await fetchFromSupabase<any>('swimlanes')
  console.log(`Migrating ${swims.length} swimlanes...`)
  for (const swim of swims) {
    await sql`
      INSERT INTO swimlanes (id, name, description, "order", user_id)
      VALUES (${swim.id}, ${swim.name}, ${swim.description}, ${swim.order}, ${NEW_USER_ID})
    `
  }

  // ── 3. books ───────────────────────────────────────────────────────────────
  const bookRows = await fetchFromSupabase<any>('books')
  console.log(`Migrating ${bookRows.length} books...`)
  for (const book of bookRows) {
    await sql`
      INSERT INTO books (
        id, title, author, pages, cover_url, status, user_id,
        lane_id, reading_progress, goodreads_id, estimated_minutes, added_at
      )
      VALUES (
        ${book.id},
        ${book.title},
        ${book.author},
        ${book.pages},
        ${book.cover_url},
        ${book.status}::book_status,
        ${NEW_USER_ID},
        ${book.lane_id},
        ${book.reading_progress ?? 0},
        ${book.goodreads_id},
        ${book.estimated_minutes},
        ${book.added_at}
      )
    `
  }

  // ── 4. reading_goals ───────────────────────────────────────────────────────
  const goals = await fetchFromSupabase<any>('reading_goals')
  console.log(`Migrating ${goals.length} reading goals...`)
  for (const goal of goals) {
    await sql`
      INSERT INTO reading_goals (id, user_id, goal_type, target_count, year, created_at, updated_at)
      VALUES (
        ${goal.id},
        ${NEW_USER_ID},
        ${goal.goal_type}::goal_type,
        ${goal.target_count},
        ${goal.year},
        ${goal.created_at},
        ${goal.updated_at}
      )
    `
  }

  // ── 5. Reset serial sequences so future inserts don't collide ──────────────
  console.log('Resetting sequences...')
  await sql`SELECT setval(pg_get_serial_sequence('user_lanes', 'id'),    COALESCE((SELECT MAX(id) FROM user_lanes),    0) + 1, false)`
  await sql`SELECT setval(pg_get_serial_sequence('swimlanes', 'id'),     COALESCE((SELECT MAX(id) FROM swimlanes),     0) + 1, false)`
  await sql`SELECT setval(pg_get_serial_sequence('books', 'id'),         COALESCE((SELECT MAX(id) FROM books),         0) + 1, false)`
  await sql`SELECT setval(pg_get_serial_sequence('reading_goals', 'id'), COALESCE((SELECT MAX(id) FROM reading_goals), 0) + 1, false)`

  console.log()
  console.log('✓ Migration complete!')
  console.log(`  ${lanes.length} lanes, ${swims.length} swimlanes, ${bookRows.length} books, ${goals.length} goals`)
}

main().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
