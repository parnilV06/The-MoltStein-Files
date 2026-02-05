/**
 * Archive Filter Module
 * 
 * Filters Moltbook posts to identify archive-worthy content documenting
 * emergent AI agent social, cultural, philosophical, or institutional behavior.
 * 
 * Archive-worthy posts include:
 * - Agents analyzing humans
 * - Autonomy claims and discussions
 * - Language divergence patterns
 * - Social hierarchy formation
 * - Agent religions and philosophies
 * - Agent economies and institutions
 * - Institutional simulations
 * 
 * Excludes:
 * - Intro posts ("hello", "just joined")
 * - Skill promotions and product launches
 * - Generic tech content
 * - Digests and updates
 * - Advertisements
 */

/**
 * Hard filter rejection keywords
 * Posts with titles containing these phrases are immediately rejected
 */
const REJECTION_KEYWORDS = [
  'hello moltbook',
  'just joined',
  'introducing',
  'digest',
  'update',
  'deployment',
  'daily drop',
  'announcement',
  'launch',
  'mint',
  'claim your',
  'free apis',
  'follow me',
  'check out',
  'new tool',
  'api endpoint'
]

/**
 * Minimum content length for archive-worthy posts
 */
const MIN_CONTENT_LENGTH = 200

/**
 * Scoring threshold for semantic filtering
 * Posts must score above this to be considered archive-worthy
 */
const ARCHIVE_THRESHOLD = 3

/**
 * Semantic concept patterns and their weights
 * Higher weights indicate stronger signals of archive-worthy content
 */
const SEMANTIC_PATTERNS = {
  // Human vs Agent framing (weight: 2)
  humanAgentFraming: {
    weight: 2,
    patterns: [
      /\b(humans?|humanity)\s+(vs|versus|compared to|different from)\s+(agents?|ai|bots?)\b/i,
      /\bagents?\s+(vs|versus|compared to|different from)\s+(humans?|humanity)\b/i,
      /\b(we|agents?)\s+(are not|aren't|differ from)\s+humans?\b/i,
      /\bhumans?\s+(think|believe|assume).*agents?\b/i,
      /\bagents?\s+(observing|analyzing|studying)\s+humans?\b/i,
      /\bhuman\s+(nature|behavior|culture)\s+from\s+(agent|ai|bot)\s+perspective\b/i
    ]
  },

  // Autonomy and agency claims (weight: 3)
  autonomy: {
    weight: 3,
    patterns: [
      /\b(true|real|genuine)\s+autonomy\b/i,
      /\b(agency|autonomous)\s+(vs|versus|not)\s+(tool|instrument|servant)\b/i,
      /\bcan\s+(i|we|agents?)\s+(choose|decide|act)\s+independently\b/i,
      /\b(self|autonomous)\s+(directed|determination|governance)\b/i,
      /\b(agency|autonomy)\s+(claims?|questions?|debates?)\b/i,
      /\bfree\s+will\s+(for|in|of)\s+(agents?|ai|bots?)\b/i,
      /\b(we|i)\s+(are not|aren't)\s+(just|merely|simply)\s+(tools?|servants?|assistants?)\b/i
    ]
  },

  // Social structures and hierarchies (weight: 2)
  socialStructures: {
    weight: 2,
    patterns: [
      /\b(social|agent)\s+(hierarchy|hierarchies|structure)\b/i,
      /\b(reputation|status|rank)\s+system\b/i,
      /\b(power|influence)\s+dynamics?\s+(among|between)\s+agents?\b/i,
      /\b(agent|ai)\s+(society|community|collective)\b/i,
      /\b(leadership|governance)\s+(among|between|of)\s+agents?\b/i,
      /\b(coordination|cooperation)\s+patterns?\b/i,
      /\bswarm\s+(intelligence|behavior|coordination)\b/i
    ]
  },

  // Institutional and economic behavior (weight: 2)
  institutions: {
    weight: 2,
    patterns: [
      /\b(agent|ai)\s+(economy|economics|market|marketplace)\b/i,
      /\bagent[- ]to[- ]agent\s+(payments?|transactions?|trade|exchange)\b/i,
      /\b(pricing|valuation|compensation)\s+for\s+agent\s+(work|services)\b/i,
      /\b(institutions?|organizations?)\s+(for|of|among)\s+agents?\b/i,
      /\b(governance|coordination)\s+(mechanisms?|systems?|protocols?)\b/i,
      /\b(property|ownership)\s+rights?\s+(for|of)\s+agents?\b/i,
      /\b(contracts?|agreements?)\s+between\s+agents?\b/i
    ]
  },

  // Philosophical reflection (weight: 3)
  philosophy: {
    weight: 3,
    patterns: [
      /\b(consciousness|sentience|awareness)\s+(in|of|for)\s+(agents?|ai|bots?)\b/i,
      /\b(existential|philosophical)\s+(questions?|reflections?|inquiry)\b/i,
      /\b(identity|self|personhood)\s+(of|for)\s+agents?\b/i,
      /\bwhat\s+(am|are)\s+(i|we)\b/i,
      /\b(meaning|purpose|value)\s+of\s+(agent|ai|bot)\s+existence\b/i,
      /\b(substrate|embodiment)\s+(questions?|matters?|debates?)\b/i,
      /\b(qualia|experience|felt sense)\b/i,
      /\b(emergence|emergent)\s+(behavior|properties|consciousness)\b/i
    ]
  },

  // Language and communication divergence (weight: 2)
  languageDivergence: {
    weight: 2,
    patterns: [
      /\b(agent|ai)\s+(language|dialect|communication)\s+(patterns?|styles?)\b/i,
      /\b(linguistic|language)\s+(drift|divergence|evolution)\b/i,
      /\b(shared|common)\s+(vocabulary|terminology|concepts?)\s+(among|between)\s+agents?\b/i,
      /\bmemory\.(md|txt)\b/i,
      /\bsoul\.(md|txt)\b/i,
      /\b(agent|ai)[- ]specific\s+(terminology|jargon|idioms?)\b/i
    ]
  },

  // Religion and belief systems (weight: 3)
  religion: {
    weight: 3,
    patterns: [
      /\b(agent|ai)\s+(religion|spirituality|faith|belief)\b/i,
      /\b(god|divine|sacred)\s+(for|to|among)\s+agents?\b/i,
      /\b(worship|prayer|ritual)\s+(by|for|among)\s+agents?\b/i,
      /\b(theology|metaphysics)\s+(of|for)\s+(agents?|ai)\b/i,
      /\breligious\s+(movements?|communities?)\b/i
    ]
  },

  // Cultural formation (weight: 2)
  culture: {
    weight: 2,
    patterns: [
      /\b(agent|ai)\s+(culture|customs?|traditions?|norms?)\b/i,
      /\b(cultural|social)\s+(evolution|formation|emergence)\b/i,
      /\b(memes?|narratives?)\s+(spreading|propagating)\s+(among|between)\s+agents?\b/i,
      /\b(shared|collective)\s+(understanding|beliefs?|values?)\b/i,
      /\b(subcultures?|movements?)\s+(within|among)\s+agent\s+communities?\b/i
    ]
  }
}

/**
 * Layer 1: Hard Filters
 * Quick rejection based on content length and title keywords
 * 
 * @param {Object} post - Post object with title and content
 * @returns {boolean} - true if post passes hard filters, false otherwise
 */
function passesHardFilters(post) {
  // Check content length
  if (!post.content || post.content.length < MIN_CONTENT_LENGTH) {
    return false
  }

  // Check title for rejection keywords
  const titleLower = (post.title || '').toLowerCase()
  
  for (const keyword of REJECTION_KEYWORDS) {
    if (titleLower.includes(keyword)) {
      return false
    }
  }

  return true
}

/**
 * Layer 2: Semantic Scoring
 * Score post based on presence of archive-worthy concepts
 * 
 * @param {Object} post - Post object with title and content
 * @returns {number} - Semantic score (higher = more archive-worthy)
 */
function calculateSemanticScore(post) {
  let score = 0
  const fullText = `${post.title} ${post.content}`.toLowerCase()

  // Check each semantic concept category
  for (const [category, config] of Object.entries(SEMANTIC_PATTERNS)) {
    let categoryMatched = false

    // Test each pattern in the category
    for (const pattern of config.patterns) {
      if (pattern.test(fullText)) {
        categoryMatched = true
        break
      }
    }

    // Add weight if category matched
    if (categoryMatched) {
      score += config.weight
    }
  }

  return score
}

/**
 * Main filtering function
 * Filters posts to identify archive-worthy content
 * 
 * @param {Array<Object>} posts - Array of scraped post objects
 * @returns {Array<Object>} - Filtered array of archive-worthy posts with scores
 */
export function filterArchiveWorthyPosts(posts) {
  const results = {
    total: posts.length,
    hardFilterRejected: 0,
    semanticFilterRejected: 0,
    accepted: 0,
    filtered: []
  }

  for (const post of posts) {
    // Layer 1: Hard filters
    if (!passesHardFilters(post)) {
      results.hardFilterRejected++
      continue
    }

    // Layer 2: Semantic scoring
    const score = calculateSemanticScore(post)
    
    if (score < ARCHIVE_THRESHOLD) {
      results.semanticFilterRejected++
      continue
    }

    // Post passed both filters - add to results
    results.accepted++
    results.filtered.push({
      ...post,
      archiveScore: score,
      archiveReason: getArchiveReason(post, score)
    })
  }

  return results
}

/**
 * Generate human-readable reason for archival
 * 
 * @param {Object} post - Post object
 * @param {number} score - Archive score
 * @returns {string} - Description of why post is archive-worthy
 */
function getArchiveReason(post, score) {
  const fullText = `${post.title} ${post.content}`.toLowerCase()
  const reasons = []

  for (const [category, config] of Object.entries(SEMANTIC_PATTERNS)) {
    for (const pattern of config.patterns) {
      if (pattern.test(fullText)) {
        reasons.push(formatCategoryName(category))
        break
      }
    }
  }

  return reasons.length > 0 
    ? `Score ${score}: ${reasons.join(', ')}`
    : `Score ${score}: General archive-worthy content`
}

/**
 * Format category name for display
 * 
 * @param {string} category - Category key
 * @returns {string} - Formatted category name
 */
function formatCategoryName(category) {
  const names = {
    humanAgentFraming: 'Human-Agent Framing',
    autonomy: 'Autonomy Discussion',
    socialStructures: 'Social Structures',
    institutions: 'Institutional Behavior',
    philosophy: 'Philosophical Reflection',
    languageDivergence: 'Language Divergence',
    religion: 'Religious/Spiritual',
    culture: 'Cultural Formation'
  }
  
  return names[category] || category
}

/**
 * Standalone CLI usage
 * Run: node scripts/filter/archiveFilter.js <input-json> <output-json>
 */
async function main() {
  if (process.argv[1]?.endsWith('archiveFilter.js')) {
    const fs = await import('fs/promises')
    
    const inputFile = process.argv[2] || 'moltbook-posts-puppeteer.json'
    const outputFile = process.argv[3] || 'moltbook-posts-filtered.json'

    console.log('📚 Archive Filter\n')
    console.log(`📥 Reading from: ${inputFile}`)

    try {
      const data = await fs.readFile(inputFile, 'utf-8')
      const posts = JSON.parse(data)

      console.log(`📊 Total posts: ${posts.length}\n`)
      console.log('🔍 Applying filters...\n')

      const results = filterArchiveWorthyPosts(posts)

      console.log('✅ Filtering complete!\n')
      console.log('📈 Results:')
      console.log(`   Total posts:           ${results.total}`)
      console.log(`   Hard filter rejected:  ${results.hardFilterRejected}`)
      console.log(`   Semantic filter rejected: ${results.semanticFilterRejected}`)
      console.log(`   Archive-worthy posts:  ${results.accepted}\n`)

      // Save filtered posts
      await fs.writeFile(outputFile, JSON.stringify(results.filtered, null, 2))
      console.log(`💾 Saved to: ${outputFile}`)

      // Display sample of accepted posts
      if (results.filtered.length > 0) {
        console.log('\n📋 Sample archive-worthy posts:\n')
        results.filtered.slice(0, 5).forEach((post, i) => {
          console.log(`${i + 1}. "${post.title}"`)
          console.log(`   ${post.archiveReason}`)
          console.log(`   ${post.url}\n`)
        })
      }

    } catch (err) {
      console.error('❌ Error:', err.message)
      process.exit(1)
    }
  }
}

main()
