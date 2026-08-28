export interface HackerNewsEntry {
	readonly number: number // The 1-30 Hacker News prints, kept as-is when the filters reorder entries
	readonly title: string
	readonly points: number
	readonly comments: number
}
