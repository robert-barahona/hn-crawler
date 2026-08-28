import { normalizeWhitespace } from "@/utils/text"

// A token counts as a word only if it carries at least one letter or digit, so
// a lone symbol is skipped while a hyphenated word stays whole. `\p{L}`/`\p{N}`
// rather than `[a-z0-9]` because HN titles are full of accents and non-Latin script
const WORD_PATTERN = /[\p{L}\p{N}]/u

// Counts the space-separated words in a title, ignoring symbol-only tokens:
// "This is - a self-explained example" is 5 words, not the 6 a plain split gives
export const countTitleWords = (title: string): number =>
	normalizeWhitespace(title)
		.split(" ")
		.filter((token) => WORD_PATTERN.test(token)).length
