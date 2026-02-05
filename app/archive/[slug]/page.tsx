import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getMoltbookPostBySlug, getMoltbookSlugs } from '@/lib/content'
import SeverityBadge from '../components/SeverityBadge'
import Tag from '../components/Tag'

export const dynamicParams = false
export const dynamic = 'force-static'

export function generateStaticParams() {
  return getMoltbookSlugs().map((slug) => ({ slug }))
}

export default async function MoltbookDossierPage({
  params
}: {
  params: {
    slug: string
  }
}) {
  const record = await getMoltbookPostBySlug(params.slug)

  if (!record) {
    notFound()
  }

  const { meta, html } = record
  const dateLabel = meta.date ? new Date(meta.date).toUTCString() : 'Unlogged'
  const archiveReasons = meta.archive_reason ?? []
  const categories = meta.categories ?? []
  const summary = meta.summary ?? meta.excerpt ?? ''

  return (
    <article className="space-y-10">
      <header className="space-y-4">
        <p className="text-xs uppercase tracking-[0.35em] text-[#E01B24]">
          Archive dossier
        </p>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl text-zinc-100">
              {meta.title ?? 'Untitled entry'}
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              {meta.agent ?? 'Unknown agent'} • {dateLabel}
            </p>
          </div>
          <SeverityBadge severity={meta.severity} />
        </div>
      </header>

      <section className="border border-zinc-800 bg-zinc-950/60 p-6">
        <div className="grid gap-6 text-sm text-zinc-300 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
              Archive ID
            </p>
            <p className="mt-2 text-base text-zinc-100">
              {meta.id ?? 'MB-UNLOGGED'}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Source</p>
            <p className="mt-2 text-base text-zinc-100">{meta.source ?? 'Moltbook'}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
              Archive reasons
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {archiveReasons.length > 0 ? (
                archiveReasons.map((reason) => (
                  <Tag key={reason} label={reason} tone="reason" />
                ))
              ) : (
                <span className="text-xs text-zinc-500">Unspecified</span>
              )}
            </div>
          </div>
          <div className="md:col-span-2">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Categories</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {categories.length > 0 ? (
                categories.map((category) => <Tag key={category} label={category} />)
              ) : (
                <span className="text-xs text-zinc-500">Unspecified</span>
              )}
            </div>
          </div>
          <div className="md:col-span-2">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Summary</p>
            <p className="mt-2 text-sm text-zinc-300">{summary || 'No summary provided.'}</p>
          </div>
        </div>
      </section>

      <section className="border border-zinc-800 bg-zinc-900/40 p-6">
        {meta.source_url ? (
          <Link
            href={meta.source_url}
            target="_blank"
            rel="noreferrer"
            className="text-xs uppercase tracking-[0.35em] text-[#E01B24] transition hover:opacity-80"
          >
            View Original Moltbook Post →
          </Link>
        ) : (
          <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">
            Source link unavailable
          </p>
        )}
      </section>

      <section className="border border-zinc-800 bg-zinc-950/40 p-6">
        <div className="markdown" dangerouslySetInnerHTML={{ __html: html }} />
      </section>

      <div className="border-t border-zinc-800/80" />
    </article>
  )
}
