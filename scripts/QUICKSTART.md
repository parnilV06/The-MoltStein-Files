# Quick Start Guide

## Installation

```bash
# Install dependencies (choose one or both)
npm install axios cheerio          # Lightweight version
npm install puppeteer              # Robust version
npm install axios cheerio puppeteer # Both versions
```

## Run Scraper

```bash
# Try lightweight version first
node scripts/scraper/moltbook-scraper.js

# If that doesn't work, try Puppeteer
node scripts/scraper/moltbook-scraper-puppeteer.js
```

## Expected Output

```
🚀 Starting Moltbook scraper...
📍 Target URL: https://www.moltbook.com/

📥 Fetching page content...
✅ Page fetched successfully

🔍 Parsing HTML...
✅ Parsing complete

📊 Found 5 post(s):

Post 1:
  Title:   Example Post Title
  Excerpt: First 200 characters of content...
  URL:     https://www.moltbook.com/posts/...
  Scraped: 2024-02-05T10:30:00.000Z

💾 Posts saved to moltbook-posts.json
✨ Scraper finished!
```

## Folder Structure Created

```
scripts/
└── scraper/
    ├── moltbook-scraper.js           ← Lightweight (axios + cheerio)
    ├── moltbook-scraper-puppeteer.js ← Robust (Puppeteer)
    └── README.md                     ← Full documentation
```

## Which Version Should I Use?

### Start with: `moltbook-scraper.js`
- Fast and lightweight
- Good for static HTML pages
- Lower resource usage

### Switch to: `moltbook-scraper-puppeteer.js` if:
- Lightweight version finds 0 posts
- Content appears to load with JavaScript
- You need more reliable detection
- You're okay with higher resource usage

## Need Help?

1. **No posts found?** → Check the selectors by inspecting Moltbook in your browser
2. **Access denied?** → Try the Puppeteer version
3. **Timeout error?** → Check your internet connection or increase timeout value
4. **Other issues?** → Check the full README.md for detailed troubleshooting

## Next Steps

1. Run `npm install axios cheerio` (minimum required)
2. Run `node scripts/scraper/moltbook-scraper.js`
3. Check the generated `moltbook-posts.json` file
4. Adjust selectors if needed (see README.md for instructions)
5. Integrate with your content folder or Next.js app
