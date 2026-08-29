import type { HackerNewsEntry } from "@/lib/types/crawlerTypes"

// `NaN` and `Infinity` are numbers so we need to check `isFinite`
const isValidNumber = (value: unknown): value is number =>
	Number.isFinite(value)

// Checks what arrives in a request body, which is `unknown` until proven otherwise
export const isHackerNewsEntry = (value: unknown): value is HackerNewsEntry => {
	if (typeof value !== "object" || !value) {
		return false
	}

	const { number, title, points, comments } = value as Record<string, unknown>

	return (
		isValidNumber(number) &&
		typeof title === "string" &&
		isValidNumber(points) &&
		isValidNumber(comments)
	)
}
