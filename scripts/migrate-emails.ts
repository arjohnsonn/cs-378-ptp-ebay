/**
 * One-time email migration: renames seeded `@test.local` accounts to `@example.com`.
 *
 * The `.local` TLD is rejected by Supabase's email validator (magic link, signup flows),
 * so it looks broken in production demos. `@example.com` is RFC-reserved and always passes.
 *
 * Safe to re-run — idempotent via email pattern match.
 *
 * Run: `npx tsx scripts/migrate-emails.ts`
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function main() {
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (error) throw error

  const targets = data.users.filter((u) => u.email?.endsWith('@test.local'))

  if (targets.length === 0) {
    console.log('No @test.local users found — nothing to migrate.')
    return
  }

  console.log(`Migrating ${targets.length} accounts:\n`)

  for (const user of targets) {
    const newEmail = user.email!.replace('@test.local', '@example.com')

    const { error: updateErr } = await supabase.auth.admin.updateUserById(user.id, {
      email: newEmail,
      email_confirm: true,
    })

    if (updateErr) {
      console.warn(`  ✗  ${user.email} → ${newEmail}: ${updateErr.message}`)
      continue
    }

    // profiles.email is denormalized via the on-signup trigger but never updated on email change.
    const { error: profileErr } = await supabase
      .from('profiles')
      .update({ email: newEmail })
      .eq('id', user.id)

    if (profileErr) {
      console.warn(`  ⚠  ${newEmail} auth updated but profile email sync failed: ${profileErr.message}`)
    } else {
      console.log(`  ✓  ${user.email} → ${newEmail}`)
    }
  }

  console.log('\n✅ Done. Passwords unchanged — use the same ones from the seed.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
