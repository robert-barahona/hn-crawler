// Collapses every run of whitespace into a single space and trims the result.
// `\s` covers the non-breaking spaces that scraped HTML is full of
export const normalizeWhitespace = (text: string): string =>
	text.replace(/\s+/g, " ").trim()
