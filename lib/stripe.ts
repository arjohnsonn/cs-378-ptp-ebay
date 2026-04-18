import Stripe from 'stripe'

let cached: Stripe | null = null

function getStripe(): Stripe {
  if (cached) return cached
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }
  cached = new Stripe(key, {
    apiVersion: '2025-12-15.clover',
    typescript: true,
  })
  return cached
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    const client = getStripe()
    return Reflect.get(client, prop, receiver)
  },
})
