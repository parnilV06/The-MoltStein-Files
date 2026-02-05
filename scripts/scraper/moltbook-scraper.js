import axios from 'axios'
import { load } from 'cheerio'

/**
 * Moltbook Web Scraper
 * Fetches public posts from Moltbook and extracts structured data
 * for archival purposes
 */

const MOLTBOOK_URL = 'https://www.moltbook.com/'

/**
 * Fetch and parse Moltbook homepage
 * @returns {Promise<Array>} Array of post objects with title, excerpt, and url
 */
async function scrapeMoltbook() {
  try {
    console.log('🚀 Starting Moltbook scraper...')
    console.log(`📍 Target URL: ${MOLTBOOK_URL}\n`)

    // Step 1: Fetch the page
    console.log('📥 Fetching page content...')
    const { data } = await axios.get(MOLTBOOK_URL, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    })

    console.log('✅ Page fetched successfully\n')

    // Step 2: Parse HTML with cheerio
    console.log('🔍 Parsing HTML...')
    const $ = load(data)

    // Step 3: Extract posts
    // IMPORTANT: These selectors are PLACEHOLDERS - you must inspect the actual
    // Moltbook DOM structure and update them accordingly
    // See "HOW TO FIND SELECTORS" section below for instructions

    const posts = []

    // Common selectors to try (update based on actual DOM inspection):
    // - Post container: article, .post, .post-item, [data-post], .status
    // - Title: h2, h3, .post-title, .title
    // - Excerpt: p, .post-excerpt, .content, .text
    // - Link: a, [href*="/posts/"], [href*="/status/"]

    $('article').each((index, element) => {
      try {
        // Extract title
        const titleElement = $(element).find('h2, h3, .post-title, .title')
        const title = titleElement.text().trim()

        // Extract excerpt (first paragraph or content preview)
        const excerptElement = $(element).find('p, .post-excerpt, .content, .text').first()
        const excerpt = excerptElement.text().trim().substring(0, 200) // First 200 chars

        // Extract URL
        const linkElement = $(element).find('a[href*="/posts/"], a[href*="/status/"], a').first()
        const url = linkElement.attr('href')

        // Only add posts with at least title and URL
        if (title && url) {
          // Convert relative URLs to absolute
          const absoluteUrl = url.startsWith('http')
            ? url
            : `${MOLTBOOK_URL.replace(/\/$/, '')}${url}`

          posts.push({
            title,
            excerpt: excerpt || 'No excerpt available',
            url: absoluteUrl,
            scrapedAt: new Date().toISOString()
          })
        }
      } catch (err) {
        console.warn(`⚠️  Error parsing post at index ${index}:`, err.message)
      }
    })

    console.log(`✅ Parsing complete\n`)

    // Step 4: Display results
    if (posts.length === 0) {
      console.log('⚠️  No posts found.')
      console.log(
        '📌 This likely means the DOM selectors need to be updated.\n' +
          '   See "HOW TO FIND SELECTORS" section in the script.\n'
      )
      return []
    }

    console.log(`📊 Found ${posts.length} post(s):\n`)
    posts.forEach((post, index) => {
      console.log(`Post ${index + 1}:`)
      console.log(`  Title:   ${post.title}`)
      console.log(`  Excerpt: ${post.excerpt}`)
      console.log(`  URL:     ${post.url}`)
      console.log(`  Scraped: ${post.scrapedAt}\n`)
    })

    return posts
  } catch (error) {
    console.error('❌ Error during scraping:')
    console.error(`   ${error.message}\n`)

    if (error.code === 'ENOTFOUND') {
      console.log('💡 Network error: Unable to reach moltbook.com')
      console.log('   Check your internet connection and try again.\n')
    } else if (error.response?.status === 403) {
      console.log('💡 Access forbidden (403): The site may block automated requests.')
      console.log('   Consider using the Puppeteer version instead.\n')
    } else if (error.code === 'ECONNABORTED') {
      console.log('💡 Request timeout: The page took too long to respond.')
      console.log('   Try increasing the timeout value or using Puppeteer.\n')
    }

    return []
  }
}

/**
 * Save posts to JSON file
 * @param {Array} posts - Array of post objects
 * @param {string} filename - Output filename
 */
async function savePostsToFile(posts, filename = 'moltbook-posts.json') {
  if (posts.length === 0) {
    console.log('⏭️  Skipping file save - no posts to save')
    return
  }

  try {
    const fs = await import('fs/promises')
    await fs.writeFile(filename, JSON.stringify(posts, null, 2))
    console.log(`💾 Posts saved to ${filename}`)
  } catch (err) {
    console.error(`❌ Error saving file: ${err.message}`)
  }
}

/**
 * Main execution
 */
async function main() {
  const posts = await scrapeMoltbook()

  if (posts.length > 0) {
    await savePostsToFile(posts)
  }

  console.log('\n✨ Scraper finished!')
}

main()

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * HOW TO FIND AND UPDATE SELECTORS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The selectors in this script are PLACEHOLDERS. You need to inspect the actual
 * Moltbook.com website to find the correct CSS selectors.
 *
 * STEPS:
 *
 * 1. Open https://www.moltbook.com/ in your browser
 *
 * 2. Right-click on a post and select "Inspect" (or press F12)
 *
 * 3. Look for the HTML structure. Find:
 *    - Post container (usually <article>, <div class="post">, etc.)
 *    - Title element (usually <h2>, <h3>, etc.)
 *    - Post content/excerpt (usually <p>, <div class="content">, etc.)
 *    - Post link (usually <a href="...">)
 *
 * 4. Update the selectors in the scrapeMoltbook() function:
 *
 *    EXAMPLE: If you find posts in <div class="moltpost">:
 *    Change: $('article').each(...)
 *    To:     $('.moltpost').each(...)
 *
 *    EXAMPLE: If the title is in <span class="molt-title">:
 *    Change: titleElement = $(element).find('h2, h3, .post-title, .title')
 *    To:     titleElement = $(element).find('.molt-title')
 *
 * 5. Run the scraper again: node scripts/scraper/moltbook-scraper.js
 *
 * COMMON MOLTBOOK SELECTORS TO TRY:
 * (These are guesses - adjust based on actual HTML inspection)
 *
 * - .post, .moltpost, .status, [data-post-id]
 * - .post-title, .molt-title, .text-headline
 * - .post-content, .molt-content, .text-body
 * - .post-link, .molt-permalink
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */
