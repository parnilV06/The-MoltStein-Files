import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_FILE = path.join(__dirname, '../../moltbook-posts-filtered.json');
const OUTPUT_DIR = path.join(__dirname, '../../content/moltbook');

/**
 * Generate markdown files from filtered Moltbook posts
 */
async function generateMarkdownFiles() {
  try {
    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      console.log(`✅ Created directory: ${OUTPUT_DIR}`);
    }

    // Read filtered posts
    const data = fs.readFileSync(INPUT_FILE, 'utf-8');
    const posts = JSON.parse(data);

    if (!Array.isArray(posts) || posts.length === 0) {
      console.log('⚠️  No posts found in filtered JSON');
      return;
    }

    console.log(`📖 Processing ${posts.length} posts...\n`);

    let generatedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      const postNumber = String(i + 1).padStart(4, '0');
      const filename = `MB-${postNumber}.md`;
      const filepath = path.join(OUTPUT_DIR, filename);

      // Check if file already exists
      if (fs.existsSync(filepath)) {
        console.log(`⏭️  Skipped: ${filename} (already exists)`);
        skippedCount++;
        continue;
      }

      // Generate markdown content
      const markdown = generateMarkdown(post, `MB-${postNumber}`);

      // Write file
      fs.writeFileSync(filepath, markdown, 'utf-8');
      console.log(`✅ Created: ${filename} - "${post.title.substring(0, 50)}..."`);
      generatedCount++;
    }

    // Log summary
    console.log(`\n📊 Summary:`);
    console.log(`   Generated: ${generatedCount} files`);
    console.log(`   Skipped: ${skippedCount} files (already exist)`);
    console.log(`   Total posts processed: ${posts.length}`);
    console.log(`\n💾 Files saved to: ${OUTPUT_DIR}`);
  } catch (error) {
    console.error('❌ Error generating markdown files:', error.message);
    process.exit(1);
  }
}

/**
 * Generate markdown content with frontmatter
 */
function generateMarkdown(post, id) {
  // Determine severity based on archive score or score
  const score = typeof post.archiveScore === 'number' ? post.archiveScore : post.score;
  const severity = getSeverity(score);

  // Parse archive reasons and categories
  const archiveReasons = normalizeReasons(post.archive_reason, post.archiveReason);
  const categories = normalizeCategories(post.categories, post.archiveReason);

  // Generate excerpt + summary
  const excerpt = normalizeExcerpt(post.excerpt, post.content);
  const summary = normalizeSummary(post.summary, excerpt, post.content);

  // Format date (handle empty dates)
  const formattedDate = post.date ? new Date(post.date).toISOString().split('T')[0] : '';

  // Clean content
  const cleanedContent = cleanContent(post.content);

  // Build frontmatter
  const frontmatter = `---
id: ${id}
title: "${escapeQuotes(post.title)}"
agent: "${escapeQuotes(post.agent || 'Unknown')}"
date: "${formattedDate}"
source: Moltbook
source_url: "${post.url}"
severity: ${severity}
categories: [${categories.map((c) => `"${escapeQuotes(c)}"`).join(', ')}]
archive_reason: [${archiveReasons.map((r) => `"${escapeQuotes(r)}"`).join(', ')}]
excerpt: "${escapeQuotes(excerpt)}"
summary: "${escapeQuotes(summary)}"
---`;

  return `${frontmatter}\n\n${cleanedContent}`;
}

/**
 * Determine severity level based on archive score
 */
function getSeverity(score) {
  if (score >= 8) return 'critical';
  if (score >= 5) return 'high';
  if (score >= 3) return 'medium';
  return 'low';
}

/**
 * Parse categories from archiveReason string
 * Example: "Score 8: Autonomy Discussion, Philosophical Reflection, Language Divergence"
 */
function normalizeReasons(explicitReasons, reasonString) {
  if (Array.isArray(explicitReasons) && explicitReasons.length > 0) {
    return explicitReasons.filter(Boolean);
  }

  return parseReasonString(reasonString);
}

function normalizeCategories(explicitCategories, reasonString) {
  if (Array.isArray(explicitCategories) && explicitCategories.length > 0) {
    return explicitCategories.filter(Boolean);
  }

  return parseReasonString(reasonString);
}

function parseReasonString(reasonString) {
  if (!reasonString) return [];

  const match = reasonString.match(/: (.+)$/);
  if (!match) return [];

  return match[1]
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function normalizeExcerpt(excerpt, content) {
  if (excerpt && excerpt.trim().length > 0) {
    return excerpt.trim();
  }

  return content.substring(0, 240).replace(/\n/g, ' ').trim();
}

function normalizeSummary(summary, excerpt, content) {
  if (summary && summary.trim().length > 0) {
    return summary.trim();
  }

  if (excerpt && excerpt.trim().length > 0) {
    return excerpt.trim();
  }

  return content.substring(0, 200).replace(/\n/g, ' ').trim();
}

/**
 * Clean and normalize content
 */
function cleanContent(content) {
  return content
    .trim()
    // Remove excessive blank lines (more than 2 consecutive)
    .replace(/\n{3,}/g, '\n\n')
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    // Fix common encoding issues
    .replace(/â€™/g, "'")
    .replace(/â€œ/g, '"')
    .replace(/â€\u009d/g, '"')
    .replace(/â€"/g, '–')
    .replace(/â€"/g, '—')
    // Clean up extra whitespace at line ends
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n');
}

/**
 * Escape quotes in strings for YAML
 */
function escapeQuotes(str) {
  if (!str) return '';
  return str.replace(/"/g, '\\"');
}

// Run the generator
generateMarkdownFiles();
