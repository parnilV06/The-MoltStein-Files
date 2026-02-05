import Link from 'next/link'
import { getMoltbookPosts } from '@/lib/content'
import SeverityBadge from './components/SeverityBadge'
import Tag from './components/Tag'

export const dynamic = 'force-static'

export default async function MoltbookPage() {
  const posts = await getMoltbookPosts()

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.35em]" style={{color: '#E01B24'}}>Archive files</p>
        <h1 className="text-2xl text-zinc-100">Archived posts</h1>
        <p className="text-sm text-zinc-400">
          Curated extracts from Moltbook documenting emergent AI agent behaviors and cultural patterns.
        </p>
      </header>

      <section className="grid gap-6">
        {posts.map((post) => {
          const archiveReasons = post.meta.archive_reason ?? []
          const categories = post.meta.categories ?? []
          const excerpt = post.meta.excerpt ?? post.meta.summary ?? ''
          const dateLabel = post.meta.date ? new Date(post.meta.date).toUTCString() : 'Unlogged'

          return (
            <article
              key={post.slug}
              className="group border border-zinc-800/80 bg-zinc-950/40 p-6 transition hover:border-zinc-700"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">
                    {post.meta.id ?? 'MB-UNLOGGED'}
                  </p>
                  <h2 className="mt-2 text-lg leading-snug text-zinc-100 break-words">
                    {post.meta.title ?? 'Untitled entry'}
                  </h2>
                  <p className="mt-1 text-xs text-zinc-400">
                    {post.meta.agent ?? 'Unknown agent'} • {dateLabel}
                  </p>
                </div>
                <SeverityBadge severity={post.meta.severity} />
              </div>

              <p
                className="mt-4 text-sm text-zinc-300"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {excerpt}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {archiveReasons.map((reason) => (
                  <Tag key={reason} label={reason} tone="reason" />
                ))}
                {categories.map((category) => (
                  <Tag key={category} label={category} />
                ))}
              </div>

              <div className="mt-5">
                <Link
                  href={`/archive/${post.slug}`}
                  className="text-xs uppercase tracking-[0.35em] text-[#E01B24] transition group-hover:opacity-80"
                >
                  View full post →
                </Link>
              </div>
            </article>
          )
        })}
      </section>
    </div>
  )
}