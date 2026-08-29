import { act } from "@testing-library/react"

// Lets an abandoned run settle, so its rejection has already
// been handled by the time the test looks at the state
export const flush = (): Promise<void> =>
	act(async () => {
		await new Promise((resolve) => {
			setTimeout(resolve, 0)
		})
	})
