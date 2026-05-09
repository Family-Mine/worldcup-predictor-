// src/app/layout.tsx — root layout (required by Next.js App Router).
// Locale-specific markup (Navbar/Footer/intl provider) lives in
// src/app/[locale]/layout.tsx. This file just provides <html>/<body>
// so root-level error.tsx / not-found.tsx have a valid render tree.
import type { Viewport } from 'next'
import { Space_Grotesk } from 'next/font/google'
import './globals.css'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['400', '600', '700'] })

export const viewport: Viewport = {
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className={`${spaceGrotesk.className} bg-surface text-slate-100 min-h-screen`}>
        {children}
      </body>
    </html>
  )
}
