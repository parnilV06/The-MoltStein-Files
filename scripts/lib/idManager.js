import fs from 'fs';
import path from 'path';

/**
 * ID Manager - Handles hybrid archival ID system
 * Manages both global Archive IDs and daily intake indices
 */

/**
 * Get the next global Archive ID
 * Scans all existing Markdown files and finds the highest Archive ID
 * @param {string} moltbookDir - Path to moltbook directory
 * @returns {string} Next Archive ID in format "MB-00001"
 */
export function getNextArchiveId(moltbookDir) {
  const files = fs.readdirSync(moltbookDir).filter((file) => file.endsWith('.md'));

  let maxNumber = 0;

  files.forEach((file) => {
    const content = fs.readFileSync(path.join(moltbookDir, file), 'utf-8');
    
    // Try to extract Archive ID from metadata
    const archiveIdMatch = content.match(/Archive ID:\s*MB-(\d+)/);
    if (archiveIdMatch) {
      const num = parseInt(archiveIdMatch[1], 10);
      maxNumber = Math.max(maxNumber, num);
    }
    
    // Fallback: extract from old-style id field for legacy files
    const idMatch = content.match(/^id:\s*MB-(\d+)/m);
    if (idMatch) {
      const num = parseInt(idMatch[1], 10);
      maxNumber = Math.max(maxNumber, num);
    }
  });

  const nextNumber = maxNumber + 1;
  return `MB-${String(nextNumber).padStart(5, '0')}`;
}

/**
 * Get today's date in YYYYMMDD format
 * @returns {string} Today's date as YYYYMMDD
 */
export function getTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Format date for display (YYYY-MM-DD)
 * @param {string} dateString - Date in YYYYMMDD format
 * @returns {string} Date in YYYY-MM-DD format
 */
export function formatDateForMetadata(dateString) {
  if (!dateString || dateString.length !== 8) {
    return new Date().toISOString().split('T')[0];
  }
  const year = dateString.substring(0, 4);
  const month = dateString.substring(4, 6);
  const day = dateString.substring(6, 8);
  return `${year}-${month}-${day}`;
}

/**
 * Get the next daily intake index
 * Scans existing files for today's date and finds the highest index
 * @param {string} moltbookDir - Path to moltbook directory
 * @param {string} dateYYYYMMDD - Date in YYYYMMDD format
 * @returns {number} Next intake index (1-based)
 */
export function getNextDailyIntakeIndex(moltbookDir, dateYYYYMMDD) {
  const files = fs.readdirSync(moltbookDir).filter((file) => file.endsWith('.md'));

  let maxIndex = 0;

  files.forEach((file) => {
    // Match new format: MB-YYYYMMDD-XXX.md
    const match = file.match(/^MB-(\d{8})-(\d{3})\.md$/);
    if (match && match[1] === dateYYYYMMDD) {
      const index = parseInt(match[2], 10);
      maxIndex = Math.max(maxIndex, index);
    }
  });

  return maxIndex + 1;
}

/**
 * Generate new filename in hybrid format
 * @param {string} dateYYYYMMDD - Date in YYYYMMDD format
 * @param {number} intakeIndex - Daily intake index (1-based)
 * @returns {string} Filename in format MB-YYYYMMDD-XXX.md
 */
export function generateFilename(dateYYYYMMDD, intakeIndex) {
  const indexStr = String(intakeIndex).padStart(3, '0');
  return `MB-${dateYYYYMMDD}-${indexStr}.md`;
}

/**
 * Check if a URL already exists in any archive file
 * Prevents duplicate archival artifacts
 * @param {string} moltbookDir - Path to moltbook directory
 * @param {string} url - URL to check
 * @returns {boolean} True if URL exists in archive
 */
export function urlExistsInArchive(moltbookDir, url) {
  if (!url) return false;

  const files = fs.readdirSync(moltbookDir).filter((file) => file.endsWith('.md'));

  for (const file of files) {
    const filePath = path.join(moltbookDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Check for source_url in frontmatter or URL in content
    if (content.includes(`source_url: "${url}"`) || content.includes(url)) {
      return true;
    }
  }

  return false;
}

/**
 * Extract metadata from filename
 * Parses new hybrid format: MB-YYYYMMDD-XXX
 * @param {string} filename - Filename without extension
 * @returns {object|null} Object with {date, intakeIndex} or null if invalid
 */
export function parseHybridFilename(filename) {
  const match = filename.match(/^MB-(\d{8})-(\d{3})$/);
  if (!match) return null;

  return {
    date: match[1],
    intakeIndex: parseInt(match[2], 10),
  };
}

/**
 * Generate intake batch ID
 * @param {string} dateYYYYMMDD - Date in YYYYMMDD format
 * @param {number} intakeIndex - Daily intake index
 * @returns {string} Intake batch ID in format YYYY-MM-DD-XXX
 */
export function generateIntakeBatchId(dateYYYYMMDD, intakeIndex) {
  const year = dateYYYYMMDD.substring(0, 4);
  const month = dateYYYYMMDD.substring(4, 6);
  const day = dateYYYYMMDD.substring(6, 8);
  const indexStr = String(intakeIndex).padStart(3, '0');
  return `${year}-${month}-${day}-${indexStr}`;
}
