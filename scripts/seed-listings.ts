import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const testSellers = [
  { email: 'seller1@test.local', displayName: 'VintageFinds' },
  { email: 'seller2@test.local', displayName: 'TechDeals' },
  { email: 'seller3@test.local', displayName: 'HomeGoods' },
  { email: 'seller4@test.local', displayName: 'StyleShop' },
]

const sampleListings = [
  {
    title: 'Vintage Polaroid Camera',
    description: 'Classic Polaroid OneStep camera in excellent condition. Takes instant photos with that nostalgic look. Includes original strap.',
    price_cents: 8500,
    sellerIndex: 0,
    images: [
      'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800',
      'https://images.unsplash.com/photo-1495121605193-b116b5b9c5fe?w=800',
    ],
  },
  {
    title: 'Mechanical Keyboard - Cherry MX Blue',
    description: 'Custom mechanical keyboard with Cherry MX Blue switches. RGB backlighting, PBT keycaps. Perfect for typing enthusiasts.',
    price_cents: 15000,
    sellerIndex: 1,
    images: [
      'https://images.unsplash.com/photo-1595225476474-87563907a212?w=800',
      'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800',
    ],
  },
  {
    title: 'Leather Messenger Bag',
    description: 'Handcrafted genuine leather messenger bag. Perfect for laptops up to 15". Multiple compartments, adjustable strap.',
    price_cents: 12000,
    sellerIndex: 2,
    images: [
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800',
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800',
    ],
  },
  {
    title: 'Vintage Vinyl Records Collection',
    description: 'Collection of 20 classic rock vinyl records from the 70s and 80s. Beatles, Pink Floyd, Led Zeppelin and more. All in good condition.',
    price_cents: 25000,
    sellerIndex: 0,
    images: [
      'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=800',
      'https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?w=800',
    ],
  },
  {
    title: 'Succulent Plant Set (6 pcs)',
    description: 'Beautiful set of 6 assorted succulents in ceramic pots. Low maintenance, perfect for desk or windowsill.',
    price_cents: 3500,
    sellerIndex: 2,
    images: [
      'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=800',
      'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800',
    ],
  },
  {
    title: 'Wireless Earbuds - Premium',
    description: 'High-quality wireless earbuds with active noise cancellation. 30 hour battery life, water resistant. Includes charging case.',
    price_cents: 9900,
    sellerIndex: 1,
    images: [
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800',
      'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800',
    ],
  },
  {
    title: 'Handmade Ceramic Mug Set',
    description: 'Set of 4 handmade ceramic mugs. Each piece is unique with beautiful glaze patterns. Microwave and dishwasher safe.',
    price_cents: 4500,
    sellerIndex: 2,
    images: [
      'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800',
      'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800',
    ],
  },
  {
    title: 'Vintage Desk Lamp',
    description: 'Mid-century modern desk lamp with adjustable arm. Brass finish, includes LED bulb. Perfect for home office.',
    price_cents: 7500,
    sellerIndex: 0,
    images: [
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800',
      'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800',
    ],
  },
  {
    title: 'Canvas Sneakers - White',
    description: 'Classic white canvas sneakers, size 10. Brand new, never worn. Minimalist design, comfortable for all-day wear.',
    price_cents: 5500,
    sellerIndex: 3,
    images: [
      'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800',
      'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800',
    ],
  },
  {
    title: 'Watercolor Paint Set',
    description: 'Professional watercolor set with 48 colors. Includes brushes, palette, and carrying case. Perfect for artists.',
    price_cents: 6500,
    sellerIndex: 2,
    images: [
      'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800',
      'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800',
    ],
  },
  {
    title: 'Minimalist Watch - Rose Gold',
    description: 'Elegant minimalist watch with rose gold case and white dial. Genuine leather strap. Japanese quartz movement.',
    price_cents: 11000,
    sellerIndex: 3,
    images: [
      'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800',
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
    ],
  },
  {
    title: 'Bluetooth Speaker - Portable',
    description: 'Compact portable speaker with 360° sound. 20 hour battery, waterproof IPX7. Perfect for outdoor adventures.',
    price_cents: 7900,
    sellerIndex: 1,
    images: [
      'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800',
      'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800',
    ],
  },
]

async function seed() {
  console.log('Seeding database...')

  const sellerIds: string[] = []

  for (const seller of testSellers) {
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === seller.email)

    if (existingUser) {
      console.log(`Seller ${seller.email} already exists`)
      sellerIds.push(existingUser.id)

      await supabase
        .from('profiles')
        .update({ display_name: seller.displayName })
        .eq('id', existingUser.id)
    } else {
      const { data: newUser, error } = await supabase.auth.admin.createUser({
        email: seller.email,
        password: 'testpassword123',
        email_confirm: true,
      })

      if (error) {
        console.error(`Error creating seller ${seller.email}:`, error)
        continue
      }

      console.log(`Created seller: ${seller.email}`)
      sellerIds.push(newUser.user.id)

      await supabase
        .from('profiles')
        .update({ display_name: seller.displayName })
        .eq('id', newUser.user.id)
    }
  }

  if (sellerIds.length === 0) {
    console.error('No sellers available. Exiting.')
    process.exit(1)
  }

  for (const listing of sampleListings) {
    const sellerId = sellerIds[listing.sellerIndex % sellerIds.length]

    const { data: existing } = await supabase
      .from('listings')
      .select('id')
      .eq('title', listing.title)
      .eq('seller_id', sellerId)
      .single()

    if (existing) {
      console.log(`Listing "${listing.title}" already exists, skipping`)
      continue
    }

    const { data: newListing, error: listingError } = await supabase
      .from('listings')
      .insert({
        seller_id: sellerId,
        title: listing.title,
        description: listing.description,
        price_cents: listing.price_cents,
        status: 'ACTIVE',
      })
      .select()
      .single()

    if (listingError) {
      console.error(`Error creating listing "${listing.title}":`, listingError)
      continue
    }

    console.log(`Created listing: ${listing.title} (by ${testSellers[listing.sellerIndex].displayName})`)

    for (let i = 0; i < listing.images.length; i++) {
      const { error: imageError } = await supabase
        .from('listing_images')
        .insert({
          listing_id: newListing.id,
          url: listing.images[i],
          position: i,
        })

      if (imageError) {
        console.error(`Error adding image to "${listing.title}":`, imageError)
      }
    }
  }

  console.log('Seeding complete!')
}

seed().catch(console.error)
