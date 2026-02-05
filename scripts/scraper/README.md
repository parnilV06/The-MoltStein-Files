# Moltbook Web Scraper

A Node.js web scraper for extracting public posts from [Moltbook](https://www.moltbook.com/) for archival purposes in "The Moltsteine Files" project.

## Features

- ✅ Extracts post title, excerpt, and URL
- ✅ Two implementations: lightweight (axios/cheerio) and robust (Puppeteer)
- ✅ Error handling and graceful fallbacks
- ✅ JSON output for easy integration
- ✅ Clear console logging for debugging
- ✅ Open-source, no paid APIs required

## Installation

### 1. Install Dependencies

Choose your installation method based on which scraper version you want to use:

**For the lightweight axios/cheerio version:**
```bash
npm install axios cheerio
```

**For the Puppeteer version (handles JavaScript-rendered content):**
```bash
npm install puppeteer
```

**For both versions:**
```bash
npm install axios cheerio puppeteer
```

### 2. Verify Installation

```bash
npm list axios cheerio puppeteer
```

## Usage

### Lightweight Scraper (Recommended First Try)

This version uses axios for HTTP requests and cheerio for HTML parsing. It's fast and lightweight.

```bash
node scripts/scraper/moltbook-scraper.js
```

**Pros:**
- Fast execution
- Low memory usage
- Works well with static HTML

**Cons:**
- Won't work if content is JavaScript-rendered
- May need selector adjustments

### Puppeteer Scraper (For Dynamic Content)

Use this if the lightweight version returns 0 posts or if Moltbook content loads dynamically.

```bash
node scripts/scraper/moltbook-scraper-puppeteer.js
```

**Pros:**
- Handles JavaScript-rendered content
- More reliable for complex single-page apps
- Waits for elements to render

**Cons:**
- Slower execution
- Higher memory usage
- Requires more system resources

## Output Files

### From Lightweight Scraper
- `moltbook-posts.json` - Extracted posts

### From Puppeteer Scraper
- `moltbook-posts-puppeteer.json` - Extracted posts

### Post Object Structure

Each post in the JSON output has this format:

```json
{
  "title": "Post Title Here",
  "excerpt": "First 200 characters of the post content...",
  "url": "https://www.moltbook.com/posts/...",
  "scrapedAt": "2024-02-05T10:30:00.000Z"
}
```

## Troubleshooting

### No Posts Found

**Cause:** The CSS selectors don't match the actual page structure

**Solution:**
1. Open https://www.moltbook.com/ in your browser
2. Right-click on a post and select "Inspect" (F12)
3. Look at the HTML structure
4. Update the selectors in the script (see comments in the code)
5. Run the scraper again

### Access Forbidden (403 Error)

**Cause:** Moltbook blocks automated requests from axios

**Solution:** Use the Puppeteer version instead, which behaves more like a real browser

```bash
node scripts/scraper/moltbook-scraper-puppeteer.js
```

### Request Timeout

**Cause:** The server is slow or the connection is unstable

**Solution:** Try again later, or increase the timeout value in the script

### Connection Refused or DNS Error

**Cause:** Network connectivity issue or Moltbook is down

**Solution:** Check your internet connection and verify Moltbook.com is accessible

## Customization

### Changing the Output Filename

In either scraper file, locate the `savePostsToFile()` call at the bottom:

```javascript
await savePostsToFile(posts, 'my-custom-filename.json')
```

### Adjusting Timeout Values

**For axios version:**
```javascript
timeout: 10000  // in milliseconds (10 seconds)
```

**For Puppeteer version:**
```javascript
waitUntil: 'networkidle2',
timeout: 30000  // in milliseconds (30 seconds)
```

### Limiting Number of Posts

Add this after posts are extracted:

```javascript
const limitedPosts = posts.slice(0, 10)  // Get only first 10 posts
```

## Finding the Correct Selectors

Both scrapers include detailed comments about how to find the correct CSS selectors for Moltbook's structure. See the "HOW TO FIND SELECTORS" section in either script for step-by-step instructions.

## Integration with Next.js

To automatically run the scraper and integrate results:

1. Add a script to `package.json`:
```json
{
  "scripts": {
    "scrape": "node scripts/scraper/moltbook-scraper.js"
  }
}
```

2. Run before building:
```bash
npm run scrape && npm run build
```

3. Process the output JSON in your Next.js app:
```typescript
import posts from '../../../moltbook-posts.json'
```

## Important Notes

⚠️ **Always respect robots.txt and Terms of Service**
- Only scrape publicly accessible content
- Don't overload the server with requests
- Check Moltbook's ToS before using scraped content

⚠️ **Rate Limiting**
- Add delays between requests if scraping multiple pages
- Consider implementing a queue system for large-scale scraping

## Project Structure

```
TMF/
├── scripts/
│   └── scraper/
│       ├── moltbook-scraper.js           # Lightweight version
│       ├── moltbook-scraper-puppeteer.js # Robust version
│       └── README.md                      # This file
├── package.json
└── ...
```

## License

These scripts are part of "The Moltsteine Files" project.
