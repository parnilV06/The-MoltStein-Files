import puppeteer from 'puppeteer'

const MOLTBOOK_URL = 'https://www.moltbook.com/'

async function inspectMoltbook() {
  let browser
  try {
    console.log('🔍 Moltbook DOM Inspector\n')
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 720 })
    console.log('📥 Loading page...\n')
    await page.goto(MOLTBOOK_URL, { waitUntil: 'networkidle2', timeout: 30000 })
      await new Promise(r => setTimeout(r, 3000))

    const domInfo = await page.evaluate(() => {
      const h3s = Array.from(document.querySelectorAll('h3')).slice(0, 5).map(h => ({
        text: h.innerText.substring(0, 60),
        class: h.className,
        parentTag: h.parentElement?.tagName
      }))

      return {
        h1: document.querySelectorAll('h1').length,
        h2: document.querySelectorAll('h2').length,
        h3: document.querySelectorAll('h3').length,
        articles: document.querySelectorAll('article').length,
        links: document.querySelectorAll('a').length,
        h3Samples: h3s,
        pageTitle: document.title
      }
    })

    console.log('📊 Page Analysis:')
    console.log(`   H1: ${domInfo.h1}, H2: ${domInfo.h2}, H3: ${domInfo.h3}`)
    console.log(`   Articles: ${domInfo.articles}, Links: ${domInfo.links}`)
    console.log(`   Title: ${domInfo.pageTitle}\n`)

    if (domInfo.h3Samples.length > 0) {
      console.log('📋 Sample H3 Elements:\n')
      domInfo.h3Samples.forEach((h3, i) => {
        console.log(`   ${i+1}. "${h3.text}"`)
        console.log(`      Parent: <${h3.parentTag}> Class: ${h3.class}\n`)
      })
    }

    console.log('✅ Done! Use these findings to update moltbook-scraper-puppeteer.js')

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    if (browser) await browser.close()
  }
}

inspectMoltbook()
