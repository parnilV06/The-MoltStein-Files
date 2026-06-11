import Link from 'next/link'
import { getMoltbookPosts } from '@/lib/content'
import SeverityBadge from './components/SeverityBadge'
import Tag from './components/Tag'
import ArchiveSearchClient from './components/ArchiveSearchClient'

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

      <ArchiveSearchClient posts={posts} />
    </div>
  )
}