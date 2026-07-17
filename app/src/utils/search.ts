import bookDataJson from '../assets/book_data.json';
import { recipeOverrides } from '../assets/recipeOverrides';
import { bookContentOverrides } from '../assets/bookContentOverrides';
import { additionalBookSections } from '../assets/additionalBookSections';
import { sanitizeBookContent } from '../assets/bookContentSanitizer';

export interface BookSection {
  id: string;
  chapter_num: number;
  chapter_title: string;
  section_title: string;
  content_md: string;
  content_html: string;
  start_page: number;
  end_page: number;
  stages: string[];
  tags: string[];
}

const baseBookData = (bookDataJson as BookSection[]).map(section => ({
  ...section,
  ...recipeOverrides[section.id],
  ...bookContentOverrides[section.id],
}));

const poopGuideInsertIndex = baseBookData.findIndex(section => section.id === 'ch_08_sec_14') + 1;
const bookData = [
  ...baseBookData.slice(0, poopGuideInsertIndex),
  ...additionalBookSections,
  ...baseBookData.slice(poopGuideInsertIndex),
].map(section => ({
  ...section,
  content_md: sanitizeBookContent(section.content_md),
}));

export interface SearchResult {
  section: BookSection;
  score: number;
  snippet: string;
  matchedWords: string[];
}

const STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "arent", "as", "at", 
  "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "cant", "cannot", "could", 
  "couldnt", "did", "didnt", "do", "does", "doesnt", "doing", "dont", "down", "during", "each", "few", "for", "from", 
  "further", "had", "hadnt", "has", "hasnt", "have", "havent", "having", "he", "hed", "hell", "hes", "her", "here", 
  "heres", "hers", "herself", "him", "himself", "his", "how", "hows", "i", "id", "ill", "im", "ive", "if", "in", "into", 
  "is", "isnt", "it", "its", "itself", "lets", "me", "more", "most", "mustnt", "my", "myself", "no", "nor", "not", "of", 
  "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shant", 
  "she", "shed", "shell", "shes", "should", "shouldnt", "so", "some", "such", "than", "that", "thats", "the", "their", 
  "theirs", "them", "themselves", "then", "there", "theres", "these", "they", "theyd", "theyll", "theyre", "theyve", 
  "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasnt", "we", "wed", "well", "were", 
  "weve", "werent", "what", "whats", "when", "whens", "where", "wheres", "which", "while", "who", "whos", "whom", 
  "why", "whys", "with", "wont", "would", "wouldnt", "you", "youd", "youll", "youre", "youve", "your", "yours", 
  "yourself", "yourselves", "baby", "babies", "child", "infant", "newborn", "parent", "parents", "should", "what", 
  "read", "where", "tell", "show", "help", "different", "ways", "way", "various", "many", "common", "tips", "guide", "book"
]);

export function getStagesByAge(months: number | null, isPregnant: boolean): string[] {
  if (isPregnant) return ["Pregnancy", "Birth preparation"];
  if (months === null) return ["General"];
  const stages = ["General"];
  if (months >= 0 && months <= 3) stages.push("Birth to 3 months");
  if (months >= 3 && months <= 6) stages.push("3 to 6 months");
  if (months >= 6 && months <= 12) stages.push("6 to 12 months");
  if (months >= 12 && months <= 24) stages.push("12 to 24 months");
  if (months >= 24 && months <= 36) stages.push("24 to 36 months");
  return stages;
}

// Custom simple trim for safety
if (!String.prototype.trim) {
  // Polyfill if needed, but modern JS has it
}

export function searchBook(query: string, babyAgeMonths: number | null, isPregnant: boolean): SearchResult[] {
  const cleanQuery = query.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!cleanQuery) return [];

  // Detect breastfeeding positions intent
  const queryLower = cleanQuery.toLowerCase();
  const hasPositionKeyword = /\b(position|positions|hold|holds|way|ways|technique|techniques|style|styles|cradle|football|lying|side-lying)\b/.test(queryLower);
  const hasBreastfeedingKeyword = /\b(breastfeeding|breastfeed|feeding|feed|nursing|lactation|latch)\b/.test(queryLower);
  const isBreastfeedingPositionsQuery = (hasPositionKeyword && hasBreastfeedingKeyword) || /\b(cradle|cross-cradle|football hold|side-lying)\b/.test(queryLower);

  // Extract keywords
  const tokens = cleanQuery.split(' ');
  const keywords = tokens.filter(t => t.length > 1 && !STOP_WORDS.has(t));
  
  // Fallback to full tokens if all were filtered
  const activeKeywords = keywords.length > 0 ? keywords : tokens.filter(t => t.length > 0);
  if (activeKeywords.length === 0) return [];

  const userStages = getStagesByAge(babyAgeMonths, isPregnant);
  const results: SearchResult[] = [];

  for (const section of bookData) {
    let score = 0;
    const contentLower = section.content_md.toLowerCase();
    const titleLower = section.section_title.toLowerCase();
    const chapterLower = section.chapter_title.toLowerCase();
    const matchedWords: string[] = [];

    for (const word of activeKeywords) {
      let wordMatched = false;
      
      // Exact or partial match in tags (Highest weight)
      for (const tag of section.tags) {
        if (tag.includes(word) || word.includes(tag)) {
          score += 25;
          wordMatched = true;
        }
      }

      // Match in section title
      if (titleLower.includes(word)) {
        score += 15;
        wordMatched = true;
      }

      // Match in chapter title
      if (chapterLower.includes(word)) {
        score += 8;
        wordMatched = true;
      }

      // Matches in content
      const regex = new RegExp('\\b' + word + '\\b', 'g');
      const matches = contentLower.match(regex);
      if (matches) {
        score += matches.length * 3;
        wordMatched = true;
      } else if (contentLower.includes(word)) {
        // Fallback for sub-word matching
        score += 1;
        wordMatched = true;
      }

      if (wordMatched && !matchedWords.includes(word)) {
        matchedWords.push(word);
      }
    }

    if (score > 0) {
      // Intent boosts
      if (isBreastfeedingPositionsQuery) {
        if (section.id === 'ch_06_sec_4') {
          score += 150; // Massively boost the core positioning/holds section
        } else if (titleLower.includes('position') || titleLower.includes('latch')) {
          score += 50; // Boost other related positioning/latch sections
        }
      }
      // Prioritize sections matching user's current stage
      const stageOverlap = section.stages.some(st => userStages.includes(st));
      if (stageOverlap) {
        score *= 1.4; // 40% boost for relevant developmental stages
      }

      // Boost safety/emergency content if querying safety keywords
      const safetyKeywords = ["emergency", "fever", "choke", "poison", "burn", "breathing", "dehydration", "warning", "hospital", "doctor"];
      const isSafetyQuery = activeKeywords.some(w => safetyKeywords.includes(w));
      const isSafetySection = section.tags.includes("safety") || section.content_md.includes("!IMPORTANT") || section.content_md.includes("!WARNING");
      if (isSafetyQuery && isSafetySection) {
        score *= 2.0; // Double the score for safety match in safety query
      }

      // Extract the best snippet from section content
      const snippet = extractBestSnippet(section.content_md, activeKeywords);

      results.push({
        section,
        score,
        snippet,
        matchedWords
      });
    }
  }

  // Sort by score descending
  return results.sort((a, b) => b.score - a.score);
}

function extractBestSnippet(contentMd: string, keywords: string[]): string {
  // Look for emergency boxes first as high-priority highlights
  const paragraphs = contentMd.split(/\n\n+/);
  let bestParagraph = "";
  let maxMatches = -1;

  for (const para of paragraphs) {
    let matchesCount = 0;
    const paraLower = para.toLowerCase();
    
    // Check keyword matches in paragraph
    for (const kw of keywords) {
      const occurrences = paraLower.split(kw).length - 1;
      matchesCount += occurrences;
    }

    // Give extra weight to warnings/important blocks
    if (para.includes("> [!IMPORTANT]") || para.includes("> [!WARNING]")) {
      matchesCount += 2;
    }

    if (matchesCount > maxMatches) {
      maxMatches = matchesCount;
      bestParagraph = para;
    }
  }

  // Formatting paragraph for display: remove markdown blockquote angles, etc.
  let displaySnippet = bestParagraph
    .replace(/^>\s*\[!.*?\]/g, '') // remove > [!IMPORTANT]
    .replace(/^>\s*/gm, '') // remove > blockquotes
    .replace(/!\[.*?\]\(.*?\)/g, '') // remove images
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // remove links
    .replace(/[*_#`]/g, '') // remove basic md markers
    .trim();

  // If too long, truncate it nicely
  if (displaySnippet.length > 280) {
    // Try to truncate at sentence end
    const truncated = displaySnippet.substring(0, 260);
    const lastPeriod = truncated.lastIndexOf('.');
    if (lastPeriod > 100) {
      displaySnippet = displaySnippet.substring(0, lastPeriod + 1) + " ...";
    } else {
      displaySnippet = truncated + "...";
    }
  }

  return displaySnippet || "Read more about this section in the book.";
}
