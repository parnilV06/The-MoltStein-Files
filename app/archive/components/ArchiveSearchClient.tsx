'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import type { MoltbookEntry } from '@/lib/content'
import Link from 'next/link'
import SeverityBadge from './SeverityBadge'
import Tag from './Tag'

type ArchiveSearchClientProps = {
  posts: MoltbookEntry[]
}

export default function ArchiveSearchClient({ posts }: ArchiveSearchClientProps) {
  // STEP 2: Add Search State
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // STEP 6: Debounce Implementation
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 150) // 150ms debounce delay

    return () => clearTimeout(timer)
  }, [query])

  // STEP 3: Filtering Logic (CORE PART)
  // Create a function to check if a string matches the query (case-insensitive)
  const matchesQuery = useCallback((text: string, searchQuery: string): boolean => {
    return text.toLowerCase().includes(searchQuery.toLowerCase())
  }, [])

  // useMemo to filter posts based on query
  const filteredPosts = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return posts
    }

    return posts.filter((post) => {
      const title = post.meta.title ?? ''
      const summary = post.meta.summary ?? post.meta.excerpt ?? ''
      const id = post.meta.id ?? ''
      const agent = post.meta.agent ?? ''
      const categories = post.meta.categories ?? []
      const archiveReasons = post.meta.archive_reason ?? []

      // Match against multiple fields
      const titleMatch = matchesQuery(title, debouncedQuery)
      const summaryMatch = matchesQuery(summary, debouncedQuery)
      const idMatch = matchesQuery(id, debouncedQuery)
      const agentMatch = matchesQuery(agent, debouncedQuery)
      const categoryMatch = categories.some((cat) => matchesQuery(cat, debouncedQuery))
      const reasonMatch = archiveReasons.some((reason) => matchesQuery(reason, debouncedQuery))

      return titleMatch || summaryMatch || idMatch || agentMatch || categoryMatch || reasonMatch
    })
  }, [posts, debouncedQuery, matchesQuery])

  // STEP 2: Search Input UI
  const handleClearSearch = () => {
    setQuery('')
  }

  return (
    <>
      {/* Search Input Section */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by title, summary, tags, or ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                handleClearSearch()
              }
            }}
            className="w-full rounded-lg border border-zinc-700/50 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 transition focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600/50"
          />
          {query && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 transition hover:text-zinc-200"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        {/* Search hint and result count */}
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-zinc-500">
            {debouncedQuery ? `Found ${filteredPosts.length} result${filteredPosts.length !== 1 ? 's' : ''}` : `Showing all ${posts.length} posts`}
          </p>
        </div>
      </div>

      {/* Posts Grid */}
      <section className="grid gap-6">
        {/* STEP 5: Empty State Handling */}
        {filteredPosts.length === 0 && debouncedQuery ? (
          <div className="rounded-lg border border-zinc-800/50 bg-zinc-950/30 p-8 text-center">
            <p className="text-sm text-zinc-300">
              No posts found matching "<strong>{debouncedQuery}</strong>"
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              Try different keywords, check tags, or <button onClick={handleClearSearch} className="underline hover:text-zinc-400">clear search</button>
            </p>
          </div>
        ) : (
          // STEP 4: Replace Render Source (use filteredPosts instead of posts)
          filteredPosts.map((post) => <ArchivePostCard key={post.slug} post={post} />)
        )}
      </section>
    </>
  )
}

// Archive Post Card Component (extracted for reusability)
function ArchivePostCard({ post }: { post: MoltbookEntry }) {
  const archiveReasons = post.meta.archive_reason ?? []
  const categories = post.meta.categories ?? []
  const excerpt = post.meta.excerpt ?? post.meta.summary ?? ''
  const dateLabel = post.meta.date ? new Date(post.meta.date).toUTCString() : 'Unlogged'

  return (
    <article className="group border border-zinc-800/80 bg-zinc-950/40 p-6 transition hover:border-zinc-700">
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
}
