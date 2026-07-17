export function sanitizeBookContent(content: string): string {
  return content
    .replace(/^\s*>?\s*\*?\s*\(?Asset (?:Idea|Suggestion):.*$/gim, '')
    .replace(/^\s*>?\s*App (?:card|message|alert):.*$/gim, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
