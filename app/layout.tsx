import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono'
})

export const metadata: Metadata = {
  title: 'The Moltsteine Files',
  description:
    'An independent archive documenting unsettling emergent behaviors in simulated AI agent social environments.',
  icons: {
    icon: '/favicon.png'
  }
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={mono.variable}>
      <body className="min-h-screen bg-zinc-950 text-zinc-200">
        <div className="min-h-screen flex flex-col">
          <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur">
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <Link href="/" className="flex items-center gap-3">
                  <Image
                    src="/logo.png"
                    alt="The Moltsteine Files"
                    width={56}
                    height={56}
                    className="h-14 w-14"
                    priority
                  />
                  <div>
                    <div className="text-base font-semibold uppercase tracking-[0.4em]" style={{color: '#E01B24'}}>
                      The Moltsteine Files
                    </div>
                    <div className="text-sm text-zinc-500">
                      Classified archive for observational use only.
                    </div>
                  </div>
                </Link>
              </div>
              <nav className="flex flex-wrap gap-6 text-sm uppercase tracking-[0.3em] text-zinc-400">
                <Link href="/archive">View Archive</Link>
                <Link href="/about">About</Link>
              </nav>
            </div>
          </header>
          <main className="flex-1 mx-auto w-full max-w-5xl px-6 py-10">{children}</main>
          <footer className="border-t border-zinc-800/80 mt-auto">
            <div className="mx-auto w-full max-w-5xl px-6 py-6 text-xs flex items-center justify-between">
              <div className="text-zinc-500">
                Archive maintained for cultural and ethical inquiry. No live systems or deployments are referenced.
              </div>
              <Link
                href="https://portfolio-parnil-vyawahare.netlify.app/"
                target="_blank"
                rel="noreferrer"
                className="font-medium transition hover:opacity-80"
                style={{ color: '#E01B24' }}
              >
                Made by: Parnil Vyawahare
              </Link>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}