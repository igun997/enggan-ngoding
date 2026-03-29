import { KeywordEntry } from "../types";

export function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

export function matchKeywords(
  tokens: string[],
  entries: KeywordEntry[],
): KeywordEntry[] {
  const matched: KeywordEntry[] = [];
  for (const entry of entries) {
    const found = entry.keywords.some((kw) => tokens.includes(kw));
    if (found) {
      matched.push(entry);
    }
  }
  return matched;
}
