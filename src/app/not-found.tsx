import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-6">
      <div className="max-w-md w-full bg-surface-card border-t-2 border-t-fifa-gold border border-surface-border rounded-lg p-8 text-center">
        <div className="text-6xl font-bold text-fifa-gold mb-2">404</div>
        <h1 className="text-2xl font-bold text-slate-100 mb-2">Page not found</h1>
        <p className="text-slate-400 mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block px-5 py-2 rounded-md bg-fifa-gold text-surface font-semibold hover:opacity-90 transition"
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}
