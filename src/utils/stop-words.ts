// Common English stop words that don't need translation
export const STOP_WORDS = new Set([
  // Articles
  'a', 'an', 'the',
  // Pronouns
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'its', 'our', 'their', 'mine', 'yours', 'ours', 'theirs',
  'this', 'that', 'these', 'those',
  // Prepositions
  'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from', 'of', 'about',
  'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'between', 'under', 'again', 'further', 'then', 'once',
  // Conjunctions
  'and', 'but', 'or', 'nor', 'so', 'yet', 'both', 'either', 'neither',
  'not', 'only', 'if', 'when', 'while', 'although', 'because', 'unless',
  // Be verbs
  'be', 'is', 'am', 'are', 'was', 'were', 'been', 'being',
  // Have verbs
  'have', 'has', 'had', 'having',
  // Do verbs
  'do', 'does', 'did', 'doing', 'done',
  // Modal verbs
  'can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must',
  // Common verbs
  'get', 'got', 'go', 'went', 'gone', 'make', 'made',
  // Others
  'as', 'than', 'such', 'no', 'yes', 'very', 'just', 'also', 'too',
  'here', 'there', 'where', 'how', 'what', 'who', 'which', 'why', 'all',
  'each', 'every', 'any', 'some', 'most', 'other', 'own', 'same', 'few',
  'more', 'now', 'over', 'up', 'down', 'out'
]);

export function isStopWord(word: string): boolean {
  return STOP_WORDS.has(word.toLowerCase());
}
