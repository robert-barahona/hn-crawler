// Wraps an async function so calls within ttlMs reuse the same result instead of running again;
// Caches the promise, not the value, so calls that arrive while it's still running join the same one
export const cacheFor = <T>(
	produce: () => Promise<T>,
	ttlMs: number,
): (() => Promise<T>) => {
	let cached: { at: number; value: Promise<T> } | null = null

	return () => {
		if (cached && Date.now() - cached.at < ttlMs) {
			return cached.value
		}

		const value = produce()
		cached = { at: Date.now(), value }

		// Clears a failed run so the next call retries instead of getting the error until ttlMs expires
		value.catch(() => {
			// Compares by reference so a failed run that's already been replaced doesn't clear the new one
			if (cached?.value === value) {
				cached = null
			}
		})

		return value
	}
}
