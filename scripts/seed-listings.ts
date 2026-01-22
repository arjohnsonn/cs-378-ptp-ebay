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
  // Electronics
  {
    title: 'Sony WH-1000XM4 Headphones',
    description: 'Industry-leading noise cancellation headphones. 30-hour battery, touch controls, multipoint connection. Like new condition.',
    price_cents: 22000,
    sellerIndex: 1,
    category: 'electronics',
    condition: 'like_new',
    images: [
      'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800',
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800',
    ],
  },
  {
    title: 'Nintendo Switch OLED',
    description: 'Nintendo Switch OLED model in white. Includes dock, controllers, and 3 games. Perfect condition.',
    price_cents: 28000,
    sellerIndex: 1,
    category: 'electronics',
    condition: 'like_new',
    images: [
      'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=800',
      'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=800',
    ],
  },
  {
    title: 'iPad Pro 11" with Apple Pencil',
    description: '2022 iPad Pro 11-inch, 256GB, Space Gray. Includes Apple Pencil 2nd gen and Magic Keyboard.',
    price_cents: 85000,
    sellerIndex: 1,
    category: 'electronics',
    condition: 'good',
    images: [
      'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800',
      'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800',
    ],
  },
  {
    title: 'DJI Mini 3 Pro Drone',
    description: 'Compact drone with 4K camera, obstacle avoidance, 34-min flight time. Fly More combo included.',
    price_cents: 65000,
    sellerIndex: 1,
    category: 'electronics',
    condition: 'new',
    images: [
      'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800',
      'https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?w=800',
    ],
  },

  // Fashion
  {
    title: 'Vintage Levi\'s 501 Jeans',
    description: 'Authentic vintage Levi\'s 501 from the 90s. Size 32x30. Great faded wash, no rips or stains.',
    price_cents: 8500,
    sellerIndex: 3,
    category: 'fashion',
    condition: 'good',
    images: [
      'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800',
      'https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=800',
    ],
  },
  {
    title: 'Ray-Ban Aviator Sunglasses',
    description: 'Classic Ray-Ban Aviators, gold frame with green G-15 lenses. Includes original case.',
    price_cents: 9500,
    sellerIndex: 3,
    category: 'fashion',
    condition: 'like_new',
    images: [
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800',
      'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800',
    ],
  },
  {
    title: 'Fjallraven Kanken Backpack',
    description: 'Classic Kanken backpack in forest green. Water-resistant, 16L capacity. Barely used.',
    price_cents: 6500,
    sellerIndex: 3,
    category: 'fashion',
    condition: 'like_new',
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800',
      'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=800',
    ],
  },
  {
    title: 'Cashmere Scarf - Burgundy',
    description: '100% pure cashmere scarf. Soft, warm, and luxurious. Perfect for winter.',
    price_cents: 12000,
    sellerIndex: 3,
    category: 'fashion',
    condition: 'new',
    images: [
      'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=800',
      'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800',
    ],
  },

  // Home & Garden
  {
    title: 'Le Creuset Dutch Oven 5.5qt',
    description: 'Signature Le Creuset dutch oven in Flame orange. Excellent condition, works perfectly.',
    price_cents: 18000,
    sellerIndex: 2,
    category: 'home',
    condition: 'good',
    images: [
      'https://images.unsplash.com/photo-1585664811087-47f65abbad64?w=800',
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
    ],
  },
  {
    title: 'Mid-Century Coffee Table',
    description: 'Solid walnut coffee table with tapered legs. 48"x24". Minor surface wear adds character.',
    price_cents: 35000,
    sellerIndex: 2,
    category: 'home',
    condition: 'good',
    images: [
      'https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=800',
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
    ],
  },
  {
    title: 'Monstera Deliciosa Plant',
    description: 'Large healthy Monstera with 8 leaves. About 3ft tall. Includes ceramic pot.',
    price_cents: 7500,
    sellerIndex: 2,
    category: 'home',
    condition: 'new',
    images: [
      'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=800',
      'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=800',
    ],
  },
  {
    title: 'Dyson V15 Vacuum',
    description: 'Dyson V15 Detect cordless vacuum. Laser reveals hidden dust. All attachments included.',
    price_cents: 45000,
    sellerIndex: 2,
    category: 'home',
    condition: 'like_new',
    images: [
      'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800',
      'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=800',
    ],
  },

  // Sports
  {
    title: 'Peloton Bike (3rd Gen)',
    description: 'Peloton Bike with 22" HD screen. Includes mat, weights, and shoes (size 42). 200 rides logged.',
    price_cents: 95000,
    sellerIndex: 0,
    category: 'sports',
    condition: 'good',
    images: [
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800',
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
    ],
  },
  {
    title: 'Titleist Pro V1 Golf Balls (4 dozen)',
    description: 'Brand new Titleist Pro V1 golf balls. 4 boxes of 12. Current year model.',
    price_cents: 16000,
    sellerIndex: 0,
    category: 'sports',
    condition: 'new',
    images: [
      'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800',
      'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800',
    ],
  },
  {
    title: 'Burton Snowboard 156cm',
    description: 'Burton Custom Flying V snowboard. Great all-mountain board. Some base scratches but rides great.',
    price_cents: 28000,
    sellerIndex: 0,
    category: 'sports',
    condition: 'good',
    images: [
      'https://images.unsplash.com/photo-1522056615691-da7b8106c665?w=800',
      'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800',
    ],
  },
  {
    title: 'Yoga Mat & Block Set',
    description: 'Premium 6mm yoga mat with 2 cork blocks and strap. Non-slip surface. Never used.',
    price_cents: 4500,
    sellerIndex: 0,
    category: 'sports',
    condition: 'new',
    images: [
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800',
    ],
  },

  // Collectibles
  {
    title: 'Pokemon Base Set Charizard',
    description: 'Original 1999 Base Set Charizard. PSA 7 graded. Iconic card in great condition.',
    price_cents: 35000,
    sellerIndex: 0,
    category: 'collectibles',
    condition: 'good',
    images: [
      'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=800',
      'https://images.unsplash.com/photo-1605979257913-1704eb7b6246?w=800',
    ],
  },
  {
    title: 'LEGO Star Wars Millennium Falcon',
    description: 'LEGO UCS Millennium Falcon #75192. Built once, complete with all pieces and manual.',
    price_cents: 72000,
    sellerIndex: 0,
    category: 'collectibles',
    condition: 'like_new',
    images: [
      'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=800',
      'https://images.unsplash.com/photo-1472457897821-70d3819a0e24?w=800',
    ],
  },
  {
    title: 'Vintage Star Wars Figures Lot',
    description: 'Lot of 15 original Kenner Star Wars figures from 1977-1983. All complete with weapons.',
    price_cents: 45000,
    sellerIndex: 0,
    category: 'collectibles',
    condition: 'good',
    images: [
      'https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?w=800',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    ],
  },

  // Art & Crafts
  {
    title: 'Cricut Maker 3 Bundle',
    description: 'Cricut Maker 3 with all blades, mats, and materials. Perfect for crafters. Like new.',
    price_cents: 32000,
    sellerIndex: 2,
    category: 'art',
    condition: 'like_new',
    images: [
      'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800',
      'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=800',
    ],
  },
  {
    title: 'Oil Paint Set - Artist Grade',
    description: 'Winsor & Newton oil paint set, 24 tubes. Professional artist grade. Unopened.',
    price_cents: 8500,
    sellerIndex: 2,
    category: 'art',
    condition: 'new',
    images: [
      'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800',
      'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800',
    ],
  },

  // Books
  {
    title: 'Harry Potter Complete Set (Hardcover)',
    description: 'All 7 Harry Potter books in hardcover. First American editions. Excellent condition.',
    price_cents: 15000,
    sellerIndex: 3,
    category: 'books',
    condition: 'good',
    images: [
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800',
      'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800',
    ],
  },
  {
    title: 'Vintage Encyclopedia Britannica Set',
    description: '1968 Encyclopedia Britannica complete 24-volume set. Great for collectors or display.',
    price_cents: 12000,
    sellerIndex: 3,
    category: 'books',
    condition: 'fair',
    images: [
      'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800',
      'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800',
    ],
  },

  // Music
  {
    title: 'Fender Player Stratocaster',
    description: 'Fender Player Series Strat in Sunburst. Mexican made, plays great. Includes gig bag.',
    price_cents: 55000,
    sellerIndex: 0,
    category: 'music',
    condition: 'good',
    images: [
      'https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?w=800',
      'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800',
    ],
  },
  {
    title: 'Audio-Technica AT-LP120 Turntable',
    description: 'Direct-drive turntable with USB output. Perfect for vinyl enthusiasts. Includes Ortofon cartridge.',
    price_cents: 22000,
    sellerIndex: 0,
    category: 'music',
    condition: 'like_new',
    images: [
      'https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?w=800',
      'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=800',
    ],
  },
  {
    title: 'Roland TD-17 Electronic Drum Kit',
    description: 'Roland TD-17KVX electronic drums. Mesh heads, great feel. Includes throne and sticks.',
    price_cents: 125000,
    sellerIndex: 0,
    category: 'music',
    condition: 'good',
    images: [
      'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=800',
      'https://images.unsplash.com/photo-1457523054379-8d03ab9fc2aa?w=800',
    ],
  },

  // Toys & Games
  {
    title: 'PlayStation 5 Digital Edition',
    description: 'PS5 Digital Edition with 2 controllers. Includes Spider-Man 2 and God of War Ragnarok.',
    price_cents: 38000,
    sellerIndex: 1,
    category: 'toys',
    condition: 'like_new',
    images: [
      'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800',
      'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=800',
    ],
  },
  {
    title: 'Board Game Collection (20 games)',
    description: 'Collection of 20 popular board games. Includes Catan, Ticket to Ride, Codenames, and more.',
    price_cents: 25000,
    sellerIndex: 1,
    category: 'toys',
    condition: 'good',
    images: [
      'https://images.unsplash.com/photo-1611891487122-207579d67d98?w=800',
      'https://images.unsplash.com/photo-1632501641765-e568d28b0015?w=800',
    ],
  },
  {
    title: 'Hot Wheels Collection (50 cars)',
    description: 'Lot of 50 Hot Wheels cars from various years. Mix of common and rare models. Great starter collection.',
    price_cents: 7500,
    sellerIndex: 1,
    category: 'toys',
    condition: 'good',
    images: [
      'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=800',
      'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=800',
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
        category: listing.category || 'other',
        condition: listing.condition || 'good',
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
