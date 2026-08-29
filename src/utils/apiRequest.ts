// The API answers a failure as `{ error }`, so the message the server wrote is what reaches the user
const readErrorMessage = async (response: Response): Promise<string | null> => {
	try {
		const body: unknown = await response.json()
		const { error } = (body ?? {}) as Record<string, unknown>

		return typeof error === "string" ? error : null
	} catch {
		return null
	}
}

// Calls a JSON endpoint and resolves to its parsed body, not to a `Response`
export const apiRequest = async <T>(
	path: string,
	init?: RequestInit,
): Promise<T> => {
	const response = await fetch(path, init)

	if (!response.ok) {
		throw new Error(
			(await readErrorMessage(response)) ??
				`${path} answered ${response.status}.`,
		)
	}

	return response.json()
}
