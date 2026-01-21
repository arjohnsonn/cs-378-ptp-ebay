import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex gap-4">
            <Link href="/" className="hover:underline">Home</Link>
            <Link href="/shorts" className="hover:underline">Shorts</Link>
            <Link href="/sell" className="hover:underline">Sell</Link>
          </div>
          <p>© {new Date().getFullYear()} Shortlist</p>
        </div>
      </div>
    </footer>
  )
}
