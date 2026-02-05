import puppeteer from 'puppeteer'

/**
 * Moltbook Web Scraper (Puppeteer Version) - Updated Selectors
 * Based on DOM inspection of moltbook.com
 */

const MOLTBOOK_URL = 'https://www.moltbook.com/'

async function scrapeMoltbookWithPuppeteer() {
  let browser
  try {
    console.log('🚀 Starting Moltbook scraper (Puppeteer)...')
    console.log(`📍 Target URL: ${MOLTBOOK_URL}\n`)

    // Launch browser
    console.log('🌐 Launching headless browser...')
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 720 })

    // Navigate
    console.log('📥 Navigating to Moltbook...')
    await page.goto(MOLTBOOK_URL, {
      waitUntil: 'networkidle2',
      timeout: 30000
    })

    console.log('✅ Page loaded\n')

    // Wait for content to fully render
    console.log('⏳ Waiting for posts to render...')
    try {
      await page.waitForSelector('h3.font-semibold', { timeout: 5000 })
    } catch (err) {
      console.warn('⚠️  Post elements not found - page may have different structure')
    }

    console.log('🔍 Extracting posts...\n')

    // Extract posts using page evaluation
    const posts = await page.evaluate(() => {
      const results = []

      // Moltbook uses h3 elements with class "font-semibold" for post titles
      // Each h3 is inside a parent div that contains the full post
      const titleElements = document.querySelectorAll('h3.font-semibold')

      titleElements.forEach((titleEl, index) => {
        try {
          // Get the post title
          const title = titleEl.innerText.trim()

              // Find a container that includes the post link
              let container = titleEl.parentElement
              while (container && !container.querySelector('a[href^="/post/"]')) {
                container = container.parentElement
                if (!container || container === document.body) break
              }

              let excerpt = 'No excerpt available'
              if (container) {
                const excerptCandidates = Array.from(container.querySelectorAll('p'))
                const excerptText = excerptCandidates
                  .map((el) => el.innerText.trim())
                  .find((text) => text && text !== title && text.toLowerCase() !== 'moltbook' && text.length > 20)
                if (excerptText) {
                  excerpt = excerptText.substring(0, 200)
                }
              }

              let url = ''
              let linkEl = titleEl.closest('a')
              if (!linkEl && container) {
                linkEl = container.querySelector('a[href^="/post/"]')
              }

              if (linkEl && linkEl.href) {
                url = linkEl.href
              }

          if (title && url) {
            results.push({
              title,
              excerpt,
              url,
              scrapedAt: new Date().toISOString()
            })
          }
        } catch (err) {
          console.warn(`Error extracting post ${index}`)
        }
      })

      return results
    })

    console.log(`📊 Found ${posts.length} post(s) from feed\n`)

    // SECOND PASS: Visit each post page to extract full content
    console.log('🔄 Starting second pass - extracting full post content...\n')
    
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i]
      
      try {
        console.log(`[${i + 1}/${posts.length}] Visiting: ${post.title.substring(0, 50)}...`)
        
        // Navigate to post page
        await page.goto(post.url, {
          waitUntil: 'networkidle2',
          timeout: 30000
        })

        // Wait a bit for dynamic content
        await new Promise(r => setTimeout(r, 1000))

        // Extract full post content
        const postData = await page.evaluate(() => {
          let content = 'No content available'
          let agent = 'Unknown'
          let date = ''

          // Try to find main article content
          const articleContainers = [
            'article',
            '[class*="post-content"]',
            '[class*="article"]',
            'main',
            '.content'
          ]

          let mainContent = null
          for (const selector of articleContainers) {
            mainContent = document.querySelector(selector)
            if (mainContent) break
          }

          // If no article container, try to find all paragraphs
          if (!mainContent) {
            mainContent = document.body
          }

          // Extract all paragraph text
          const paragraphs = mainContent.querySelectorAll('p')
          if (paragraphs.length > 0) {
            content = Array.from(paragraphs)
              .map(p => p.innerText.trim())
              .filter(text => text.length > 10)
              .join('\n\n')
          }

          // Try to extract agent name
          const agentSelectors = [
            '[class*="author"]',
            '[class*="agent"]',
            '[class*="user"]',
            'a[href^="/agent/"]',
            'h1',
            'h2'
          ]

          for (const selector of agentSelectors) {
            const el = document.querySelector(selector)
            if (el && el.innerText && el.innerText.trim().length > 0 && el.innerText.trim().length < 100) {
              agent = el.innerText.trim()
              break
            }
          }

          // Try to extract date/timestamp
          const dateSelectors = [
            'time',
            '[datetime]',
            '[class*="date"]',
            '[class*="time"]',
            '[class*="timestamp"]'
          ]

          for (const selector of dateSelectors) {
            const el = document.querySelector(selector)
            if (el) {
              date = el.getAttribute('datetime') || el.innerText.trim()
              break
            }
          }

          return { content, agent, date }
        })

        // Update post with full content
        posts[i] = {
          title: post.title,
          excerpt: post.excerpt,
          content: postData.content,
          agent: postData.agent,
          date: postData.date,
          url: post.url,
          scraped_at: post.scrapedAt
        }

        console.log(`   ✓ Extracted ${postData.content.length} chars\n`)

        // Add delay between requests
        await new Promise(r => setTimeout(r, 1500))

      } catch (err) {
        console.warn(`   ⚠️ Error scraping post: ${err.message}\n`)
        
        // Keep the original data if scraping fails
        posts[i] = {
          title: post.title,
          excerpt: post.excerpt,
          content: 'Failed to extract content',
          agent: 'Unknown',
          date: '',
          url: post.url,
          scraped_at: post.scrapedAt
        }
      }
    }

    console.log('\n✅ Full content extraction complete!\n')

    // Display summary
    posts.forEach((post, index) => {
      console.log(`Post ${index + 1}:`)
      console.log(`  Title:   ${post.title}`)
      console.log(`  Agent:   ${post.agent}`)
      console.log(`  Date:    ${post.date}`)
      console.log(`  Content: ${post.content.substring(0, 100)}...`)
      console.log(`  URL:     ${post.url}\n`)
    })

    return posts
  } catch (error) {
    console.error('❌ Error during scraping:')
    console.error(`   ${error.message}\n`)

    if (error.message.includes('Navigation timeout')) {
      console.log('💡 Page took too long to load. Try increasing the timeout.')
    } else if (error.message.includes('net::ERR_NAME_NOT_RESOLVED')) {
      console.log('💡 Unable to resolve moltbook.com - check your internet connection.')
    }

    return []
  } finally {
    if (browser) {
      console.log('\n🔌 Closing browser...')
      await browser.close()
    }
  }
}

/**
 * Save posts to JSON file
 */
async function savePostsToFile(posts, filename = 'moltbook-posts-puppeteer.json') {
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
  const posts = await scrapeMoltbookWithPuppeteer()

  if (posts.length > 0) {
    await savePostsToFile(posts)
  }

  console.log('\n✨ Scraper finished!')
}

main()
