import { vi } from "vitest"

// The stand-in for `fetch`: it reads the request options and decides the answer
type Respond = (init?: RequestInit) => Promise<Response>

// A request only carries a signal when its caller passed one
type CapturedSignal = AbortSignal | undefined

interface FetchStub {
	readonly signals: () => CapturedSignal[]
}

// Replaces global `fetch` with the given answer, so no test opens a socket.
// It keeps every signal it was handed, which is the only way to tell from
// outside whether a run was abandoned
export const stubFetch = (respond: Respond): FetchStub => {
	const signals: CapturedSignal[] = []

	vi.stubGlobal(
		"fetch",
		vi.fn((_path: string, init?: RequestInit) => {
			signals.push(init?.signal ?? undefined)

			return respond(init)
		}),
	)

	return { signals: () => signals }
}

// A request that only ends when it is aborted, the way `fetch` behaves
export const untilAborted: Respond = (init) =>
	new Promise((_, reject) => {
		init?.signal?.addEventListener("abort", () => {
			reject(new DOMException("The operation was aborted.", "AbortError"))
		})
	})
