// Wraps an async producer so every call within `ttlMs` reuses the last value instead of producing it again
export const cacheFor = <T>(
	produce: () => Promise<T>,
	ttlMs: number,
): (() => Promise<T>) => {
	let cached: { at: number; value: T } | null = null

	return async () => {
		if (cached && Date.now() - cached.at < ttlMs) {
			return cached.value
		}

		const value = await produce()
		cached = { at: Date.now(), value }

		return value
	}
}
