/**
 * One-time data migration: Supabase → Neon
 *
 * Fetches your user profile and all data from Supabase via its REST/Admin API
 * and inserts everything into Neon, reusing the same UUID so all foreign key
 * relationships are preserved.
 *
 * Prerequisites:
 *   1. Run `npm run db:migrate` to push the schema to Neon.
 *   2. Gather the following values:
 *      - USER_ID:              Your Supabase user UUID
 *                              (Supabase dashboard → Authentication → Users)
 *      - USER_PASSWORD:        Your current password (will be bcrypt-hashed)
 *      - SUPABASE_URL:         e.g. https://xxxx.supabase.co
 *      - SUPABASE_SERVICE_KEY: The service_role key (not the anon key)
 *                              (Supabase dashboard → Settings → API)
 *      - DATABASE_URL:         Your Neon connection string
 *
 * Usage:
 *   USER_ID=<your-uuid> \
 *   USER_PASSWORD=<your-password> \
 *   SUPABASE_URL=https://xxxx.supabase.co \
 *   SUPABASE_SERVICE_KEY=... \
 *   DATABASE_URL=... \
 *   npx tsx scripts/migrate-data.ts
 */

import { neon } from '@neondatabase/serverless'
import bcrypt from 'bcrypt'

const {
  USER_ID,
  USER_PASSWORD,
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
  DATABASE_URL,
} = process.env

function assertEnv() {
  const missing = ['USER_ID', 'USER_PASSWORD', 'SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'DATABASE_URL']
    .filter(k => !process.env[k])
  if (missing.length) {
    console.error('Missing required env vars:', missing.join(', '))
    process.exit(1)
  }
}

async function fetchSupabaseUser() {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${USER_ID}`, {
    headers: {
      apikey: SUPABASE_SERVICE_KEY!,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY!}`,
    },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Failed to fetch user from Supabase (${res.status}): ${body}`)
  }
  return res.json()
}

async function fetchFromSupabase<T>(table: string): Promise<T[]> {
  const url = `${SUPABASE_URL}/rest/v1/${table}?user_id=eq.${USER_ID}&select=*`
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

  // ── 0. user ─────────────────────────────────────────────────────────────────
  console.log('Fetching user from Supabase...')
  const supabaseUser = await fetchSupabaseUser()
  const email = supabaseUser.email
  const name = supabaseUser.user_metadata?.name
    || supabaseUser.user_metadata?.full_name
    || email.split('@')[0]
  const passwordHash = await bcrypt.hash(USER_PASSWORD!, 12)

  await sql`
    INSERT INTO users (id, email, name, password_hash)
    VALUES (${USER_ID}, ${email}, ${name}, ${passwordHash})
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name, password_hash = EXCLUDED.password_hash
  `
  console.log(`Migrated user: ${email} (${USER_ID})`)

  // ── 1. user_lanes ──────────────────────────────────────────────────────────
  const lanes = await fetchFromSupabase<any>('user_lanes')
  console.log(`Migrating ${lanes.length} lanes...`)
  for (const lane of lanes) {
    await sql`
      INSERT INTO user_lanes (id, name, user_id, "order")
      VALUES (${lane.id}, ${lane.name}, ${USER_ID}, ${lane.order})
      ON CONFLICT (id) DO NOTHING
    `
  }

  // ── 2. swimlanes ───────────────────────────────────────────────────────────
  let swims: any[] = []
  try {
    swims = await fetchFromSupabase<any>('swimlanes')
    console.log(`Migrating ${swims.length} swimlanes...`)
    for (const swim of swims) {
      await sql`
        INSERT INTO swimlanes (id, name, description, "order", user_id)
        VALUES (${swim.id}, ${swim.name}, ${swim.description}, ${swim.order}, ${USER_ID})
        ON CONFLICT (id) DO NOTHING
      `
    }
  } catch {
    console.log('No swimlanes table in Supabase, skipping...')
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
        ${USER_ID},
        ${book.lane_id},
        ${book.reading_progress ?? 0},
        ${book.goodreads_id},
        ${book.estimated_minutes},
        ${book.added_at}
      )
      ON CONFLICT (id) DO NOTHING
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
        ${USER_ID},
        ${goal.goal_type}::goal_type,
        ${goal.target_count},
        ${goal.year},
        ${goal.created_at},
        ${goal.updated_at}
      )
      ON CONFLICT (id) DO NOTHING
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
  console.log(`  1 user, ${lanes.length} lanes, ${swims.length} swimlanes, ${bookRows.length} books, ${goals.length} goals`)
}

main().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
