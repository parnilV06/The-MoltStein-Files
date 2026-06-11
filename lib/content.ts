import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'

export type Severity = 'low' | 'medium' | 'high' | 'critical'

export type FileMeta = {
  id: string
  title: string
  category: string
  severity: Severity
  date: string
  summary: string
  source?: string
}

export type MoltbookMeta = {
  id?: string
  title?: string
  agent?: string
  date?: string
  source?: string
  source_url?: string
  severity?: Severity
  categories?: string[]
  archive_reason?: string[]
  excerpt?: string
  summary?: string
}

type FileEntry = FileMeta & { slug: string }

type ParsedEntry = {
  slug: string
  meta: FileMeta
  html: string
}

export type MoltbookEntry = {
  slug: string
  meta: MoltbookMeta
  html: string
}

const filesDir = path.join(process.cwd(), 'content', 'files')
const moltbookDir = path.join(process.cwd(), 'content', 'moltbook')

function listMarkdownFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) return []
  return fs.readdirSync(directory).filter((file) => file.endsWith('.md'))
}

function readMeta(filePath: string): FileMeta {
  const raw = fs.readFileSync(filePath, 'utf8')
  const { data } = matter(raw)
  return data as FileMeta
}

function sortByDateDesc(a: { date?: string }, b: { date?: string }) {
  const dateA = dateToMs(a.date);
  const dateB = dateToMs(b.date);
  
  // If dates are different, sort by date descending
  if (dateA !== dateB) {
    return dateB - dateA;
  }
  
  // If dates are the same, try to sort by intake batch or archive ID
  // This is a fallback for maintaining consistent ordering
  return 0;
}

function dateToMs(date?: string) {
  if (!date) return 0
  const parsed = Date.parse(date)
  return Number.isNaN(parsed) ? 0 : parsed
}

export function getFileSlugs(): string[] {
  return listMarkdownFiles(filesDir).map((file) => path.parse(file).name)
}

export function getFiles(): FileEntry[] {
  return listMarkdownFiles(filesDir)
    .map((file) => {
      const slug = path.parse(file).name
      const meta = readMeta(path.join(filesDir, file))
      return { slug, ...meta }
    })
    .sort(sortByDateDesc)
}

export async function getFileBySlug(slug: string): Promise<ParsedEntry | null> {
  const fullPath = path.join(filesDir, `${slug}.md`)
  if (!fs.existsSync(fullPath)) return null

  const raw = fs.readFileSync(fullPath, 'utf8')
  const { data, content } = matter(raw)
  const processed = await remark().use(html).process(content)

  return {
    slug,
    meta: data as FileMeta,
    html: processed.toString()
  }
}

import clientPromise from './db'

export async function getMoltbookSlugs(): Promise<string[]> {
  const client = await clientPromise
  const db = client.db('tmf')
  const docs = await db.collection('posts').find({}, { projection: { slug: 1 } }).toArray()
  return docs.map(d => d.slug)
}

export async function getMoltbookPostBySlug(
  slug: string
): Promise<MoltbookEntry | null> {
  const client = await clientPromise
  const db = client.db('tmf')
  const doc = await db.collection('posts').findOne({ slug })
  if (!doc) return null

  const processed = await remark().use(html).process(doc.content || '')

  return {
    slug,
    meta: doc.meta as MoltbookMeta,
    html: processed.toString()
  }
}

export async function getMoltbookPosts(): Promise<MoltbookEntry[]> {
  const client = await clientPromise
  const db = client.db('tmf')
  
  // We only fetch meta fields and omit the heavy content/html to save payload size.
  // We're returning all 500+ items here but without html, which will drop the 22MB payload to < 1MB.
  const docs = await db.collection('posts')
    .find({}, { projection: { content: 0 } })
    .sort({ "meta.date": -1, createdAt: -1 })
    .toArray()

  return docs.map(doc => ({
    slug: doc.slug,
    meta: doc.meta as MoltbookMeta,
    html: '' // omitted to save payload size, only needed on single post page
  }))
}