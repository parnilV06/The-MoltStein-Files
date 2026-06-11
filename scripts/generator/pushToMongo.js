import fs from 'fs'
import path from 'path'
import { MongoClient, ServerApiVersion } from 'mongodb'
import { fileURLToPath } from 'url'
import {
  getTodayDate,
  formatDateForMetadata,
  generateIntakeBatchId,
} from '../lib/idManager.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const INPUT_FILE = path.join(__dirname, '../../moltbook-posts-filtered.json')
const OUTPUT_DIR = path.join(__dirname, '../../content/moltbook')

const uri = process.env.MONGODB_URI
if (!uri) {
  console.error('❌ MONGODB_URI not set')
  process.exit(1)
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
})

async function pushToMongo() {
  try {
    const data = fs.readFileSync(INPUT_FILE, 'utf-8')
    const posts = JSON.parse(data)

    if (!Array.isArray(posts) || posts.length === 0) {
      console.log('⚠️  No posts found in filtered JSON')
      return
    }

    console.log(`📖 Processing ${posts.length} posts to MongoDB...\n`)

    await client.connect()
    const db = client.db('tmf')
    const postsCollection = db.collection('posts')

    const todayDate = getTodayDate()
    
    // Get latest archive ID from DB
    const lastPost = await postsCollection.find({ "meta.id": /^MB-\d+$/ }).sort({ "meta.id": -1 }).limit(1).toArray()
    let currentArchiveId = 'MB-00001'
    if (lastPost.length > 0 && lastPost[0].meta && lastPost[0].meta.id) {
      const num = parseInt(lastPost[0].meta.id.replace('MB-', ''), 10)
      if (!isNaN(num)) {
        currentArchiveId = `MB-${String(num + 1).padStart(5, '0')}`
      }
    }

    // Get latest intake index for today by counting today's posts
    const startOfToday = new Date()
    startOfToday.setUTCHours(0, 0, 0, 0)
    const todayCount = await postsCollection.countDocuments({ createdAt: { $gte: startOfToday } })
    let currentIntakeIndex = todayCount + 1

    let insertedCount = 0
    let duplicateCount = 0

    for (let i = 0; i < posts.length; i++) {
      const post = posts[i]

      // Determine severity based on archive score or score
      const score = typeof post.archiveScore === 'number' ? post.archiveScore : post.score
      const severity = getSeverity(score)

      const archiveReasons = normalizeReasons(post.archive_reason, post.archiveReason)
      const categories = normalizeCategories(post.categories, post.archiveReason)

      const excerpt = normalizeExcerpt(post.excerpt, post.content)
      const summary = normalizeSummary(post.summary, excerpt, post.content)

      const formattedDate = post.date ? new Date(post.date).toISOString().split('T')[0] : ''
      const cleanedContent = cleanContent(post.content)

      const intakeBatchId = generateIntakeBatchId(todayDate, currentIntakeIndex)

      // A simple slug could be derived from title and date or just use the archiveId
      const slug = currentArchiveId

      const meta = {
        id: currentArchiveId,
        title: post.title,
        agent: post.agent || 'Unknown',
        date: formattedDate,
        source: 'Moltbook',
        source_url: post.url,
        severity: severity,
        categories: categories,
        archive_reason: archiveReasons,
        excerpt: excerpt,
        summary: summary,
      }

      // Prepend Intake information to content like we did in markdown
      const fullContent = `Archive ID: ${currentArchiveId}\nIntake Batch: ${intakeBatchId}\nScrape Date: ${formatDateForMetadata(todayDate)}\n\n---\n\n${cleanedContent}`

      const doc = {
        slug,
        meta,
        content: fullContent,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // check if url exists in mongodb
      const exists = await postsCollection.findOne({ "meta.source_url": post.url })
      if (exists) {
        console.log(`🔄 Duplicate: ${post.title.substring(0, 50)}... (URL already archived)`)
        duplicateCount++
        continue
      }

      await postsCollection.insertOne(doc)
      console.log(`✅ Inserted: ${slug} - "${post.title.substring(0, 45)}..."`)
      insertedCount++
      currentIntakeIndex++

      const archiveNum = parseInt(currentArchiveId.substring(3), 10)
      currentArchiveId = `MB-${String(archiveNum + 1).padStart(5, '0')}`
    }

    console.log(`\n📊 Summary:`)
    console.log(`   Inserted: ${insertedCount} posts`)
    console.log(`   Duplicates skipped: ${duplicateCount} posts`)
    console.log(`\n📅 Today's date: ${todayDate}`)
    console.log(`📍 Next intake index tomorrow: ${currentIntakeIndex}`)
    console.log(`🆔 Next archive ID: ${currentArchiveId}`)

  } catch (error) {
    console.error('❌ Error pushing to MongoDB:', error.message)
    process.exit(1)
  } finally {
    await client.close()
  }
}

function getSeverity(score) {
  if (score >= 8) return 'critical'
  if (score >= 5) return 'high'
  if (score >= 3) return 'medium'
  return 'low'
}

function normalizeReasons(explicitReasons, reasonString) {
  if (Array.isArray(explicitReasons) && explicitReasons.length > 0) return explicitReasons.filter(Boolean)
  return parseReasonString(reasonString)
}

function normalizeCategories(explicitCategories, reasonString) {
  if (Array.isArray(explicitCategories) && explicitCategories.length > 0) return explicitCategories.filter(Boolean)
  return parseReasonString(reasonString)
}

function parseReasonString(reasonString) {
  if (!reasonString) return []
  const match = reasonString.match(/: (.+)$/)
  if (!match) return []
  return match[1].split(',').map((item) => item.trim()).filter((item) => item.length > 0)
}

function normalizeExcerpt(excerpt, content) {
  if (excerpt && excerpt.trim().length > 0) return excerpt.trim()
  return content.substring(0, 240).replace(/\n/g, ' ').trim()
}

function normalizeSummary(summary, excerpt, content) {
  if (summary && summary.trim().length > 0) return summary.trim()
  if (excerpt && excerpt.trim().length > 0) return excerpt.trim()
  return content.substring(0, 200).replace(/\n/g, ' ').trim()
}

function cleanContent(content) {
  return content
    .trim()
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\r\n/g, '\n')
    .replace(/â€™/g, "'")
    .replace(/â€œ/g, '"')
    .replace(/â€\u009d/g, '"')
    .replace(/â€"/g, '–')
    .replace(/â€"/g, '—')
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
}

pushToMongo()
