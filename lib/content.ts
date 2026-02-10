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

type MoltbookEntry = {
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

export function getMoltbookSlugs(): string[] {
  return listMarkdownFiles(moltbookDir).map((file) => path.parse(file).name)
}

export async function getMoltbookPostBySlug(
  slug: string
): Promise<MoltbookEntry | null> {
  const fullPath = path.join(moltbookDir, `${slug}.md`)
  if (!fs.existsSync(fullPath)) return null

  const raw = fs.readFileSync(fullPath, 'utf8')
  const { data, content } = matter(raw)
  const processed = await remark().use(html).process(content)

  return {
    slug,
    meta: data as MoltbookMeta,
    html: processed.toString()
  }
}

export async function getMoltbookPosts(): Promise<MoltbookEntry[]> {
  const posts = await Promise.all(
    listMarkdownFiles(moltbookDir).map(async (file) => {
      const slug = path.parse(file).name
      const raw = fs.readFileSync(path.join(moltbookDir, file), 'utf8')
      const { data, content } = matter(raw)
      const processed = await remark().use(html).process(content)

      return {
        slug,
        meta: data as MoltbookMeta,
        html: processed.toString()
      }
    })
  )

  return posts.sort((a, b) => sortByDateDesc(a.meta, b.meta))
}