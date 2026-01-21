import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ShortsFeed } from '@/components/shorts-feed'
import type { ShortWithListing } from '@/lib/types/database'

export default async function ShortsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: shorts } = await supabase
    .from('shorts')
    .select(`
      *,
      listing:listings!shorts_target_listing_id_fkey(
        *,
        images:listing_images(*)
      ),
      creator:profiles(*)
    `)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div className="h-screen bg-black flex">
      {/* Left Sidebar */}
      <aside className="hidden lg:flex flex-col w-[240px] border-r border-white/10 p-4">
        <Link href="/" className="text-white text-2xl font-bold mb-8 px-2">
          Shortlist
        </Link>

        <nav className="flex flex-col gap-1">
          <Link
            href="/shorts"
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-white bg-white/10 font-semibold"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
            For You
          </Link>
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-white/70 hover:bg-white/5 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Shop
          </Link>
          <Link
            href="/sell"
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-white/70 hover:bg-white/5 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Upload
          </Link>
        </nav>

        <div className="mt-auto">
          {user ? (
            <Link
              href="/sell"
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-white/70 hover:bg-white/5 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <span className="truncate">{user.email}</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="block w-full py-3 text-center bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Log in
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative">
        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
          <Link href="/" className="font-bold text-xl text-white">
            Shortlist
          </Link>
          <Link
            href={user ? "/sell" : "/login"}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold"
          >
            {user ? "Sell" : "Log in"}
          </Link>
        </div>

        <ShortsFeed shorts={(shorts || []) as ShortWithListing[]} />
      </main>
    </div>
  )
}
