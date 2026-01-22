import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Package, ArrowLeft, DollarSign, TrendingUp } from 'lucide-react'

export default async function SellerOrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      listing:listings(id, title, images:listing_images(url)),
      buyer:profiles!orders_buyer_id_fkey(email, display_name)
    `)
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  const totalRevenue = orders?.reduce((sum, order) => {
    if (order.status === 'PAID' || order.status === 'SHIPPED' || order.status === 'DELIVERED') {
      return sum + order.amount_cents
    }
    return sum
  }, 0) || 0

  const completedOrders = orders?.filter(o =>
    o.status === 'PAID' || o.status === 'SHIPPED' || o.status === 'DELIVERED'
  ).length || 0

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    PAID: 'bg-green-100 text-green-800',
    SHIPPED: 'bg-blue-100 text-blue-800',
    DELIVERED: 'bg-purple-100 text-purple-800',
    CANCELLED: 'bg-gray-100 text-gray-600',
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/sell" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">Sales</h1>
              <p className="text-sm text-muted-foreground">Track your sold items</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-card border border-border/50 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm text-muted-foreground">Total Revenue</span>
            </div>
            <p className="text-3xl font-bold">${(totalRevenue / 100).toFixed(2)}</p>
          </div>
          <div className="bg-card border border-border/50 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Items Sold</span>
            </div>
            <p className="text-3xl font-bold">{completedOrders}</p>
          </div>
        </div>

        {/* Orders List */}
        <h2 className="text-lg font-semibold mb-4">Order History</h2>

        {!orders || orders.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border/50 rounded-2xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
              <Package className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No sales yet</h3>
            <p className="text-muted-foreground mb-6">When someone buys your listings, they&apos;ll appear here.</p>
            <Button asChild className="rounded-full">
              <Link href="/sell/listings/new">Create a Listing</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const listing = Array.isArray(order.listing) ? order.listing[0] : order.listing
              const buyer = Array.isArray(order.buyer) ? order.buyer[0] : order.buyer
              const imageUrl = listing?.images?.[0]?.url

              return (
                <div
                  key={order.id}
                  className="bg-card border border-border/50 rounded-xl p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex gap-4">
                    {imageUrl ? (
                      <div className="w-16 h-16 relative rounded-lg overflow-hidden shrink-0">
                        <Image
                          src={imageUrl}
                          alt={listing?.title || ''}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                        <Package className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-medium truncate">{listing?.title || 'Unknown Item'}</h3>
                          <p className="text-sm text-muted-foreground">
                            Sold to {buyer?.display_name || buyer?.email?.split('@')[0] || 'Unknown'}
                          </p>
                        </div>
                        <Badge className={statusColors[order.status] || 'bg-gray-100'}>
                          {order.status}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <span className="font-semibold">${(order.amount_cents / 100).toFixed(2)}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
