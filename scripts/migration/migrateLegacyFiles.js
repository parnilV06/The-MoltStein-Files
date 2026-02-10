#!/usr/bin/env node
/**
 * Migration Script: Legacy Archive File Updater
 * Renames existing MB-XXXX.md files to hybrid format and injects metadata
 *
 * Usage: node scripts/migration/migrateLegacyFiles.js
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import {
  formatDateForMetadata,
  generateIntakeBatchId,
} from '../lib/idManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MOLTBOOK_DIR = path.join(__dirname, '../../content/moltbook');

/**
 * Get the git commit date for a file
 * Falls back to current date if git history unavailable
 */
function getGitCommitDate(filePath) {
  try {
    const repoRoot = path.join(__dirname, '../../');
    const relPath = path.relative(repoRoot, filePath);
    const dateStr = execSync(`cd "${repoRoot}" && git log -1 --format=%cI -- "${relPath}"`, {
      encoding: 'utf-8',
    }).trim();

    if (dateStr) {
      // Convert ISO date to YYYYMMDD
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}${month}${day}`;
    }
  } catch (err) {
    // Git command failed, will use fallback
  }

  // Fallback to current date
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Extract old-style Archive ID from filename
 * Returns the number part of MB-XXXX
 */
function extractLegacyIdNumber(filename) {
  const match = filename.match(/^MB-(\d+)/);
  return match ? match[1] : null;
}

/**
 * Parse existing frontmatter YAML
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { meta: {}, content };

  const yamlContent = match[1];
  const restContent = content.substring(match[0].length);

  const meta = {};
  const lines = yamlContent.split('\n');
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > -1) {
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();
      // Remove quotes if present
      meta[key] = value.replace(/^"(.+)"$/, '$1');
    }
  }

  return { meta, content: restContent.trim() };
}

/**
 * Build new frontmatter with hybrid ID
 */
function buildNewFrontmatter(meta, archiveId, intakeBatchId, scrapeDate) {
  const lines = [];

  // Preserve certain fields, update critical ones
  const fieldOrder = [
    'id',
    'title',
    'agent',
    'date',
    'source',
    'source_url',
    'severity',
    'categories',
    'archive_reason',
    'excerpt',
    'summary',
  ];

  fieldOrder.forEach((key) => {
    if (key in meta) {
      let value = meta[key];
      // Don't add quotes if it already has them
      if (key === 'categories' || key === 'archive_reason') {
        lines.push(`${key}: ${value}`);
      } else {
        // Quote string values if necessary
        if (typeof value === 'string' && !value.startsWith('[') && !value.startsWith('"')) {
          value = `"${value.replace(/"/g, '\\"')}"`;
        }
        lines.push(`${key}: ${value}`);
      }
    }
  });

  const yamlContent = lines.join('\n');
  const metadata = `Archive ID: ${archiveId}\nIntake Batch: ${intakeBatchId}\nScrape Date: ${scrapeDate}`;

  return `---\n${yamlContent}\n---\n\n${metadata}\n\n---`;
}

/**
 * Migrate a single legacy file
 */
function migrateLegacyFile(filename, filePath) {
  try {
    console.log(`\n📄 Processing: ${filename}`);

    // Read file content
    const content = fs.readFileSync(filePath, 'utf-8');
    const { meta, content: bodyContent } = parseFrontmatter(content);

    // Extract legacy ID number
    const legacyIdNum = extractLegacyIdNumber(filename);
    if (!legacyIdNum) {
      console.log(`   ⚠️  Could not extract ID from filename, skipping`);
      return;
    }

    // Get git commit date
    const commitDate = getGitCommitDate(filePath);
    console.log(`   📅 Detected date: ${formatDateForMetadata(commitDate)}`);

    // Create new Archive ID (preserve old number, just pad it)
    const archiveId = `MB-${String(legacyIdNum).padStart(5, '0')}`;
    const intakeIndex = 1; // First (only) file for that legacy date
    const intakeBatchId = generateIntakeBatchId(commitDate, intakeIndex);
    const scrapeDateFormatted = formatDateForMetadata(commitDate);

    // Build new filename
    const newFilename = `MB-${commitDate}-001.md`;

    // Check if new filename already exists
    const newFilePath = path.join(MOLTBOOK_DIR, newFilename);
    if (fs.existsSync(newFilePath) && newFilename !== filename) {
      console.log(`   ⚠️  Target filename ${newFilename} already exists, skipping`);
      return;
    }

    // Build new frontmatter with metadata
    const newFrontmatter = buildNewFrontmatter(meta, archiveId, intakeBatchId, scrapeDateFormatted);
    const newContent = `${newFrontmatter}\n\n${bodyContent}`;

    // Rename file
    if (newFilename !== filename) {
      fs.renameSync(filePath, newFilePath);
      console.log(`   ✅ Renamed: ${filename} → ${newFilename}`);
      console.log(`   🆔 Archive ID: ${archiveId}`);
      console.log(`   📦 Intake Batch: ${intakeBatchId}`);

      // Update content with new metadata
      fs.writeFileSync(newFilePath, newContent, 'utf-8');
    } else {
      // Same filename, just update content
      fs.writeFileSync(filePath, newContent, 'utf-8');
      console.log(`   ✅ Updated metadata in: ${filename}`);
      console.log(`   🆔 Archive ID: ${archiveId}`);
      console.log(`   📦 Intake Batch: ${intakeBatchId}`);
    }
  } catch (error) {
    console.error(`   ❌ Error migrating ${filename}:`, error.message);
  }
}

/**
 * Main migration function
 */
async function migrateAllLegacyFiles() {
  try {
    console.log('🔄 Starting legacy archive migration...\n');
    console.log(`📂 Scanning: ${MOLTBOOK_DIR}\n`);

    if (!fs.existsSync(MOLTBOOK_DIR)) {
      console.log('⚠️  Moltbook directory does not exist');
      return;
    }

    const files = fs.readdirSync(MOLTBOOK_DIR).filter((file) => file.endsWith('.md'));

    // Filter for legacy format (MB-XXXX.md) only
    const legacyFiles = files.filter((file) => /^MB-\d{4}\.md$/.test(file));

    if (legacyFiles.length === 0) {
      console.log('✅ No legacy files found, migration skipped');
      console.log('   All files are already in hybrid format');
      return;
    }

    console.log(`Found ${legacyFiles.length} legacy file(s) to migrate\n`);

    // Migrate each file
    legacyFiles.forEach((file) => {
      const filePath = path.join(MOLTBOOK_DIR, file);
      migrateLegacyFile(file, filePath);
    });

    console.log(`\n✅ Migration complete!`);
    console.log(`   Processed: ${legacyFiles.length} file(s)`);
    console.log(`\n📍 All legacy files have been converted to hybrid format`);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run migration
migrateAllLegacyFiles();
