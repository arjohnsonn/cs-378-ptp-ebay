import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface SuccessPageProps {
  searchParams: Promise<{ order?: string }>
}

export default async function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  const { order: orderId } = await searchParams

  if (!orderId) {
    notFound()
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    notFound()
  }

  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      listing:listings(title)
    `)
    .eq('id', orderId)
    .eq('buyer_id', user.id)
    .single()

  if (!order) {
    notFound()
  }

  const listing = Array.isArray(order.listing) ? order.listing[0] : order.listing

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Purchase Complete!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            You purchased: <strong>{listing?.title}</strong>
          </p>
          <p className="text-3xl font-bold">
            ${(order.amount_cents / 100).toFixed(2)}
          </p>
          <div className="pt-4 space-y-2">
            <Button asChild className="w-full">
              <Link href="/orders">View My Orders</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Continue Shopping</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
