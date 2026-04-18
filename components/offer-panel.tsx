'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  createOffer,
  counterOffer,
  acceptOffer,
  declineOffer,
  withdrawOffer,
} from '@/lib/actions/offers'
import type { Offer } from '@/lib/types/database'

interface OfferPanelProps {
  listingId: string
  listingPriceCents: number
  minOfferCents: number | null
  latestOffer: Offer | null
  isAuthenticated: boolean
}

function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

export function OfferPanel({
  listingId,
  listingPriceCents,
  minOfferCents,
  latestOffer,
  isAuthenticated,
}: OfferPanelProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [makeOpen, setMakeOpen] = useState(false)
  const [counterOpen, setCounterOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')

  const reset = () => {
    setAmount('')
    setMessage('')
  }

  const parseAmount = () => {
    const value = parseFloat(amount)
    if (isNaN(value) || value <= 0) {
      toast.error('Enter a valid amount')
      return null
    }
    return Math.round(value * 100)
  }

  const handleCreate = () => {
    const cents = parseAmount()
    if (cents === null) return
    startTransition(async () => {
      const res = await createOffer(listingId, cents, message || undefined)
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success('Offer sent')
      setMakeOpen(false)
      reset()
      router.refresh()
    })
  }

  const handleCounter = () => {
    if (!latestOffer) return
    const cents = parseAmount()
    if (cents === null) return
    startTransition(async () => {
      const res = await counterOffer(latestOffer.id, cents, message || undefined)
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success('Counter sent')
      setCounterOpen(false)
      reset()
      router.refresh()
    })
  }

  const handleAccept = () => {
    if (!latestOffer) return
    startTransition(async () => {
      const res = await acceptOffer(latestOffer.id)
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success('Offer accepted — seller will ship after payment')
      router.refresh()
    })
  }

  const handleDecline = () => {
    if (!latestOffer) return
    startTransition(async () => {
      const res = await declineOffer(latestOffer.id)
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success('Offer declined')
      router.refresh()
    })
  }

  const handleWithdraw = () => {
    if (!latestOffer) return
    startTransition(async () => {
      const res = await withdrawOffer(latestOffer.id)
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success('Offer withdrawn')
      router.refresh()
    })
  }

  const minHint = minOfferCents
    ? `Minimum offer: ${formatMoney(minOfferCents)}`
    : `Below ${formatMoney(listingPriceCents)}`

  // Paid offer — show nothing (buy flow done)
  if (latestOffer?.status === 'ACCEPTED_PAID') {
    return (
      <div className="bg-card border border-border/50 rounded-xl p-4">
        <p className="text-sm font-medium">Your offer was accepted and paid.</p>
      </div>
    )
  }

  // Accepted — buyer needs to pay
  if (latestOffer?.status === 'ACCEPTED') {
    return (
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Badge>Accepted</Badge>
          <span className="text-sm text-muted-foreground">
            Seller accepted your offer at {formatMoney(latestOffer.amount_cents)}
          </span>
        </div>
        <form action={`/api/checkout?offer=${latestOffer.id}`} method="POST">
          <Button type="submit" size="lg" className="w-full h-12 rounded-xl">
            Pay {formatMoney(latestOffer.amount_cents)} now
          </Button>
        </form>
      </div>
    )
  }

  // Pending, seller side needs to act, buyer waits
  if (latestOffer?.status === 'PENDING' && latestOffer.from_role === 'BUYER') {
    return (
      <div className="bg-card border border-border/50 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Pending</Badge>
          <span className="text-sm text-muted-foreground">
            Your offer of {formatMoney(latestOffer.amount_cents)} is waiting on the seller
          </span>
        </div>
        <Button
          variant="outline"
          onClick={handleWithdraw}
          disabled={isPending}
          className="w-full rounded-xl"
        >
          Withdraw offer
        </Button>
      </div>
    )
  }

  // Pending, seller countered — buyer decides
  if (latestOffer?.status === 'PENDING' && latestOffer.from_role === 'SELLER') {
    return (
      <div className="bg-card border border-border/50 rounded-xl p-4 space-y-3">
        <div>
          <Badge className="mb-2">Seller countered</Badge>
          <p className="font-semibold text-lg">
            {formatMoney(latestOffer.amount_cents)}
          </p>
          {latestOffer.message && (
            <p className="text-sm text-muted-foreground mt-1">&ldquo;{latestOffer.message}&rdquo;</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={handleAccept} disabled={isPending} className="rounded-xl">
            Accept
          </Button>
          <Button
            variant="outline"
            onClick={handleDecline}
            disabled={isPending}
            className="rounded-xl"
          >
            Decline
          </Button>
        </div>
        <CounterDialog
          open={counterOpen}
          setOpen={setCounterOpen}
          amount={amount}
          setAmount={setAmount}
          message={message}
          setMessage={setMessage}
          minHint={minHint}
          onSubmit={handleCounter}
          isPending={isPending}
          triggerLabel="Counter"
          listingPriceCents={listingPriceCents}
        />
      </div>
    )
  }

  // No active offer, or terminal (declined/withdrawn/expired) — allow new offer
  const prior = latestOffer

  if (!isAuthenticated) {
    return (
      <Button asChild variant="outline" size="lg" className="w-full h-14 text-lg rounded-xl">
        <Link href={`/login?redirect=/listing/${listingId}`}>Sign in to make an offer</Link>
      </Button>
    )
  }

  return (
    <>
      {prior && prior.status !== 'PENDING' && prior.status !== 'ACCEPTED' && (
        <p className="text-xs text-muted-foreground">
          Previous offer of {formatMoney(prior.amount_cents)} was {prior.status.toLowerCase()}.
        </p>
      )}
      <Dialog open={makeOpen} onOpenChange={setMakeOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="lg" className="w-full h-14 text-lg rounded-xl">
            Make Offer
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make an offer</DialogTitle>
            <DialogDescription>{minHint}. Offers expire in 48 hours.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="offer-amount">Your offer</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="offer-amount"
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
              <Label htmlFor="offer-message">Message (optional)</Label>
              <Input
                id="offer-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={500}
                placeholder="Say something to the seller..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMakeOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isPending}>
              {isPending ? 'Sending...' : 'Send offer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

interface CounterDialogProps {
  open: boolean
  setOpen: (v: boolean) => void
  amount: string
  setAmount: (v: string) => void
  message: string
  setMessage: (v: string) => void
  minHint: string
  onSubmit: () => void
  isPending: boolean
  triggerLabel: string
  listingPriceCents: number
}

function CounterDialog({
  open,
  setOpen,
  amount,
  setAmount,
  message,
  setMessage,
  minHint,
  onSubmit,
  isPending,
  triggerLabel,
  listingPriceCents,
}: CounterDialogProps) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full rounded-xl">
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Counter offer</DialogTitle>
          <DialogDescription>{minHint}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="counter-amount">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="counter-amount"
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
            <Label htmlFor="counter-message">Message (optional)</Label>
            <Input
              id="counter-message"
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
          <Button onClick={onSubmit} disabled={isPending}>
            {isPending ? 'Sending...' : 'Send counter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
