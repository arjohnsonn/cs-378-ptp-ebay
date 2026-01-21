import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      listing:listings(title, images:listing_images(url))
    `)
    .eq('buyer_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="font-bold text-xl text-primary">Shortlist</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Orders</h1>

        {!orders || orders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No orders yet.</p>
            <Button asChild className="mt-4">
              <Link href="/">Browse Listings</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const listing = Array.isArray(order.listing) ? order.listing[0] : order.listing
              return (
                <Link key={order.id} href={`/orders/${order.id}`}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{listing?.title || 'Unknown'}</CardTitle>
                        <Badge variant={order.status === 'PAID' ? 'default' : 'secondary'}>
                          {order.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>${(order.amount_cents / 100).toFixed(2)}</span>
                        <span>{new Date(order.created_at).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
