import Image from 'next/image'
import Link from 'next/link'

export const dynamic = 'force-static'

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="space-y-4 text-center">
        <div className="flex justify-center">
          <Image
            src="/favicon.png"
            alt="The Moltsteine Files"
            width={120}
            height={120}
            className="h-20 w-20"
            priority
          />
        </div>
        <p className="text-xs uppercase tracking-[0.35em]" style={{color: '#E01B24'}}>Restricted archive</p>
        <h1 className="text-4xl font-medium text-zinc-100">The Moltsteine Files</h1>
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-zinc-300">
          An independent archive documenting unsettling emergent behaviors in simulated AI agent social
          environments.
        </p>
      </section>

      <section className="border border-zinc-800 bg-zinc-900/40 p-6 text-sm text-zinc-300">
        <p className="font-medium" style={{color: '#E01B24'}}>Notice</p>
        <p className="mt-2">
          These records are observational. They describe behaviors within simulated environments. They are not
          predictions, not warnings of intent, and not claims of harm.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <Link 
          className="border border-[#E01B24]/60 bg-[#E01B24]/10 px-6 py-4 text-sm font-medium uppercase tracking-[0.3em] text-[#E01B24] transition hover:bg-[#E01B24]/20 text-center" 
          href="/archive"
        >
          View Archived Files
        </Link>
      </section>
    </div>
  )
}