import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { MongoClient, ServerApiVersion } from 'mongodb'


const uri = process.env.MONGODB_URI
if (!uri) {
  throw new Error('MONGODB_URI not set')
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
})

async function migrate() {
  try {
    await client.connect()
    const db = client.db('tmf')
    const postsCollection = db.collection('posts')

    const moltbookDir = path.join(process.cwd(), 'content/moltbook')
    const files = fs.readdirSync(moltbookDir).filter(f => f.endsWith('.md'))

    console.log(`Found ${files.length} posts to migrate.`)

    let inserted = 0
    let updated = 0

    for (const file of files) {
      const slug = file.replace('.md', '')
      const raw = fs.readFileSync(path.join(moltbookDir, file), 'utf8')
      const { data, content } = matter(raw)

      const doc = {
        slug,
        meta: data,
        content: content.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = await postsCollection.updateOne(
        { slug },
        { $setOnInsert: { createdAt: new Date() }, $set: { meta: data, content: content.trim(), updatedAt: new Date() } },
        { upsert: true }
      )

      if (result.upsertedId) inserted++
      else updated++
    }

    console.log(`Migration complete. Inserted: ${inserted}, Updated: ${updated}`)

    // Create an index on slug and date
    await postsCollection.createIndex({ slug: 1 }, { unique: true })
    await postsCollection.createIndex({ "meta.date": -1 })

  } finally {
    await client.close()
  }
}

migrate().catch(console.error)
