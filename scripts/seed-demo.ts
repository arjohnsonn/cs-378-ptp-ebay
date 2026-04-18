/**
 * Demo-day seed. Idempotent.
 *
 * Prerequisite: run `npx tsx scripts/seed-listings.ts` first (creates sellers + listings).
 *
 * This script layers demo-specific data on top:
 *   - Enables accepts_offers on 3 listings (+ sets a minimum offer)
 *   - Creates a demo buyer account: buyer@example.com / demopassword123
 *   - Creates one PAID order for the buyer (so the review flow unlocks on /orders/[id])
 *   - Creates one PENDING offer from the buyer (so the seller accept/counter UI has something to show)
 *
 * Run: `npx tsx scripts/seed-demo.ts`
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const BUYER_EMAIL = 'buyer@example.com'
const BUYER_PASSWORD = 'demopassword123'
const BUYER_DISPLAY = 'DemoBuyer'

// Titles to flip accepts_offers on (pick recognizable ones from the base seed)
const OFFER_TITLES = [
  'Sony WH-1000XM4 Headphones',
  'Nintendo Switch OLED',
  'Vintage Levi\'s 501 Jeans',
  'Fjallraven Kanken Backpack',
]

// Listing that gets fake-purchased by the demo buyer (unlocks review flow)
const PAID_LISTING_TITLE = 'Yoga Mat & Block Set'

// Listing that gets a pending offer from buyer
const PENDING_OFFER_TITLE = 'Sony WH-1000XM4 Headphones'

async function findUserByEmail(email: string) {
  const { data, error } = await supabase.auth.admin.listUsers()
  if (error) throw error
  return data.users.find((u) => u.email === email) || null
}

async function ensureBuyer() {
  const existing = await findUserByEmail(BUYER_EMAIL)
  if (existing) {
    await supabase.from('profiles').update({ display_name: BUYER_DISPLAY }).eq('id', existing.id)
    console.log(`Buyer ${BUYER_EMAIL} already exists`)
    return existing.id
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: BUYER_EMAIL,
    password: BUYER_PASSWORD,
    email_confirm: true,
  })
  if (error) throw error
  await supabase.from('profiles').update({ display_name: BUYER_DISPLAY }).eq('id', data.user!.id)
  console.log(`Created buyer: ${BUYER_EMAIL}`)
  return data.user!.id
}

async function enableOffersOn(titles: string[]) {
  for (const title of titles) {
    const { data: listing } = await supabase
      .from('listings')
      .select('id, price_cents')
      .eq('title', title)
      .maybeSingle()

    if (!listing) {
      console.warn(`  ⚠  Listing not found: "${title}" — skip`)
      continue
    }

    const minOffer = Math.round(listing.price_cents * 0.6)
    const { error } = await supabase
      .from('listings')
      .update({ accepts_offers: true, min_offer_cents: minOffer })
      .eq('id', listing.id)

    if (error) console.warn(`  ⚠  ${title}: ${error.message}`)
    else console.log(`  ✓  accepts_offers enabled on "${title}" (min $${(minOffer / 100).toFixed(2)})`)
  }
}

async function ensurePaidOrder(buyerId: string) {
  const { data: listing } = await supabase
    .from('listings')
    .select('id, seller_id, price_cents, status')
    .eq('title', PAID_LISTING_TITLE)
    .maybeSingle()

  if (!listing) {
    console.warn(`  ⚠  "${PAID_LISTING_TITLE}" not found — skipping paid order`)
    return
  }

  const { data: existingOrder } = await supabase
    .from('orders')
    .select('id, status')
    .eq('buyer_id', buyerId)
    .eq('listing_id', listing.id)
    .maybeSingle()

  if (existingOrder) {
    console.log(`  ✓  Paid order already exists (${existingOrder.id.slice(0, 8)}, ${existingOrder.status})`)
    return
  }

  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      buyer_id: buyerId,
      seller_id: listing.seller_id,
      listing_id: listing.id,
      amount_cents: listing.price_cents,
      status: 'PAID',
      stripe_checkout_session_id: 'cs_demo_seed',
      stripe_payment_intent_id: 'pi_demo_seed',
    })
    .select()
    .single()

  if (error) {
    console.warn(`  ⚠  order insert failed: ${error.message}`)
    return
  }

  await supabase.from('listings').update({ status: 'SOLD' }).eq('id', listing.id)

  console.log(`  ✓  Created PAID order ${order.id.slice(0, 8)} for "${PAID_LISTING_TITLE}" (listing marked SOLD)`)
}

async function ensurePendingOffer(buyerId: string) {
  const { data: listing } = await supabase
    .from('listings')
    .select('id, seller_id, price_cents, accepts_offers, status')
    .eq('title', PENDING_OFFER_TITLE)
    .maybeSingle()

  if (!listing) {
    console.warn(`  ⚠  "${PENDING_OFFER_TITLE}" not found — skipping offer`)
    return
  }

  if (!listing.accepts_offers || listing.status !== 'ACTIVE') {
    console.warn(`  ⚠  "${PENDING_OFFER_TITLE}" not eligible for offer — skipping`)
    return
  }

  const { data: existing } = await supabase
    .from('offers')
    .select('id')
    .eq('listing_id', listing.id)
    .eq('buyer_id', buyerId)
    .eq('status', 'PENDING')
    .maybeSingle()

  if (existing) {
    console.log(`  ✓  Pending offer already exists (${existing.id.slice(0, 8)})`)
    return
  }

  const amount = Math.round(listing.price_cents * 0.75)
  const expires = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

  const { data: offer, error } = await supabase
    .from('offers')
    .insert({
      listing_id: listing.id,
      buyer_id: buyerId,
      seller_id: listing.seller_id,
      amount_cents: amount,
      from_role: 'BUYER',
      status: 'PENDING',
      expires_at: expires,
      message: 'Would love these for my commute — any chance?',
    })
    .select()
    .single()

  if (error) {
    console.warn(`  ⚠  offer insert failed: ${error.message}`)
    return
  }

  console.log(
    `  ✓  Created PENDING offer ${offer.id.slice(0, 8)} — $${(amount / 100).toFixed(2)} on "${PENDING_OFFER_TITLE}"`,
  )
}

async function main() {
  console.log('Demo seed starting…\n')

  console.log('→ Ensuring demo buyer account')
  const buyerId = await ensureBuyer()

  console.log('\n→ Enabling accepts_offers on selected listings')
  await enableOffersOn(OFFER_TITLES)

  console.log('\n→ Creating PAID order for review-flow demo')
  await ensurePaidOrder(buyerId)

  console.log('\n→ Creating PENDING offer for seller accept/counter demo')
  await ensurePendingOffer(buyerId)

  console.log('\n✅ Demo seed complete.\n')
  console.log('────────────────────────────────────────')
  console.log('Demo credentials:')
  console.log(`  Buyer:   ${BUYER_EMAIL}  /  ${BUYER_PASSWORD}`)
  console.log(`  Sellers: seller1@example.com … seller4@example.com  /  testpassword123`)
  console.log('────────────────────────────────────────\n')
  console.log('Walkthrough paths:')
  console.log(`  • Review flow:  log in as buyer → /orders → click the paid order → write review`)
  console.log(`  • Offer accept: log in as seller (seller2@example.com for Sony) → /listing/<id> → accept the pending offer`)
  console.log(`  • Then: log in as buyer → /offers → "Pay now" → Stripe test card 4242 4242 4242 4242`)
  console.log('')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
