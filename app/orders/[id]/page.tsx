import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface OrderPageProps {
  params: Promise<{ id: string }>
}

export default async function OrderDetailPage({ params }: OrderPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      listing:listings(*, images:listing_images(*)),
      seller:profiles!orders_seller_id_fkey(*)
    `)
    .eq('id', id)
    .or(`buyer_id.eq.${user!.id},seller_id.eq.${user!.id}`)
    .single()

  if (!order) {
    notFound()
  }

  const listing = Array.isArray(order.listing) ? order.listing[0] : order.listing
  const seller = Array.isArray(order.seller) ? order.seller[0] : order.seller
  const image = listing?.images?.[0]?.url

  const isBuyer = order.buyer_id === user!.id

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="font-bold text-xl text-primary">Shortlist</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/orders">← Back to Orders</Link>
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Order Details</CardTitle>
              <Badge variant={order.status === 'PAID' ? 'default' : 'secondary'}>
                {order.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4">
              {image && (
                <div className="w-24 h-24 relative bg-muted rounded overflow-hidden shrink-0">
                  <Image
                    src={image}
                    alt={listing?.title || ''}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
              )}
              <div>
                <h2 className="font-semibold text-lg">{listing?.title}</h2>
                <p className="text-2xl font-bold">${(order.amount_cents / 100).toFixed(2)}</p>
              </div>
            </div>

            <div className="grid gap-4 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Order ID</span>
                <span className="font-mono">{order.id.slice(0, 8)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Date</span>
                <span>{new Date(order.created_at).toLocaleString()}</span>
              </div>
              {isBuyer && seller && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Seller</span>
                  <span>{seller.display_name || seller.email}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
