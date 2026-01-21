import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function removeDuplicates() {
  console.log('Finding duplicate listings...')

  const { data: listings, error } = await supabase
    .from('listings')
    .select('id, title, created_at')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching listings:', error)
    return
  }

  const seen = new Map<string, string>()
  const duplicateIds: string[] = []

  for (const listing of listings || []) {
    if (seen.has(listing.title)) {
      console.log(`Duplicate found: "${listing.title}" (keeping older one)`)
      duplicateIds.push(listing.id)
    } else {
      seen.set(listing.title, listing.id)
    }
  }

  if (duplicateIds.length === 0) {
    console.log('No duplicates found.')
    return
  }

  console.log(`\nRemoving ${duplicateIds.length} duplicate(s)...`)

  for (const id of duplicateIds) {
    await supabase.from('listing_images').delete().eq('listing_id', id)
    await supabase.from('listings').delete().eq('id', id)
    console.log(`Deleted listing ${id}`)
  }

  console.log('Done!')
}

removeDuplicates().catch(console.error)
