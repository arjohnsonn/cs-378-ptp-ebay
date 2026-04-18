'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { acceptOffer, declineOffer, counterOffer } from '@/lib/actions/offers'
import type { Offer } from '@/lib/types/database'

interface SellerOffersPanelProps {
  offers: Offer[]
  listingPriceCents: number
}

function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

function timeLeft(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'expired'
  const hours = Math.floor(diff / (60 * 60 * 1000))
  if (hours < 1) return '<1h left'
  if (hours < 24) return `${hours}h left`
  const days = Math.floor(hours / 24)
  return `${days}d left`
}

export function SellerOffersPanel({ offers, listingPriceCents }: SellerOffersPanelProps) {
  if (offers.length === 0) {
    return (
      <div className="bg-card border border-border/50 rounded-xl p-5">
        <h2 className="font-semibold mb-1">Offers</h2>
        <p className="text-sm text-muted-foreground">No offers yet.</p>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border/50 rounded-xl p-5 space-y-4">
      <div>
        <h2 className="font-semibold">Offers</h2>
        <p className="text-xs text-muted-foreground">
          {offers.filter((o) => o.status === 'PENDING').length} pending
        </p>
      </div>
      <div className="space-y-3">
        {offers.map((offer) => (
          <OfferRow key={offer.id} offer={offer} listingPriceCents={listingPriceCents} />
        ))}
      </div>
    </div>
  )
}

function OfferRow({
  offer,
  listingPriceCents,
}: {
  offer: Offer
  listingPriceCents: number
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')

  const isAwaitingBuyer = offer.from_role === 'SELLER' && offer.status === 'PENDING'
  const canAct = offer.status === 'PENDING' && offer.from_role === 'BUYER'

  const handleAccept = () => {
    startTransition(async () => {
      const res = await acceptOffer(offer.id)
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success('Offer accepted')
      router.refresh()
    })
  }

  const handleDecline = () => {
    startTransition(async () => {
      const res = await declineOffer(offer.id)
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success('Offer declined')
      router.refresh()
    })
  }

  const handleCounter = () => {
    const value = parseFloat(amount)
    if (isNaN(value) || value <= 0) return toast.error('Enter a valid amount')
    const cents = Math.round(value * 100)
    startTransition(async () => {
      const res = await counterOffer(offer.id, cents, message || undefined)
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success('Counter sent')
      setOpen(false)
      setAmount('')
      setMessage('')
      router.refresh()
    })
  }

  const statusBadge = () => {
    if (offer.status === 'ACCEPTED') return <Badge>Accepted — awaiting payment</Badge>
    if (offer.status === 'ACCEPTED_PAID') return <Badge>Paid</Badge>
    if (isAwaitingBuyer) return <Badge variant="secondary">Countered — awaiting buyer</Badge>
    return <Badge variant="secondary">Pending</Badge>
  }

  return (
    <div className="border border-border/50 rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-lg">{formatMoney(offer.amount_cents)}</p>
          <p className="text-xs text-muted-foreground">
            {Math.round((offer.amount_cents / listingPriceCents) * 100)}% of asking ·{' '}
            {timeLeft(offer.expires_at)}
          </p>
        </div>
        {statusBadge()}
      </div>
      {offer.message && (
        <p className="text-sm text-muted-foreground italic">&ldquo;{offer.message}&rdquo;</p>
      )}
      {canAct && (
        <div className="grid grid-cols-3 gap-2 pt-1">
          <Button size="sm" onClick={handleAccept} disabled={isPending} className="rounded-lg">
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setOpen(true)}
            disabled={isPending}
            className="rounded-lg"
          >
            Counter
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDecline}
            disabled={isPending}
            className="rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            Decline
          </Button>
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Counter offer</DialogTitle>
            <DialogDescription>
              Listed at {formatMoney(listingPriceCents)}. Counter must be below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor={`seller-counter-${offer.id}`}>Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id={`seller-counter-${offer.id}`}
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={(listingPriceCents - 1) / 100}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-7"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`seller-counter-msg-${offer.id}`}>Message (optional)</Label>
              <Input
                id={`seller-counter-msg-${offer.id}`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={500}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleCounter} disabled={isPending}>
              {isPending ? 'Sending...' : 'Send counter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
