import type { UsageRepository } from "@/lib/storage/UsageRepository"
import type { HackerNewsEntry } from "@/lib/types/crawlerTypes"
import type { OperationDetail } from "@/lib/types/usageTypes"
import { describeError } from "@/utils/errors"

// Runs an operation and logs it whichever way it ends
export const recordUsage = async (
	repository: UsageRepository,
	detail: OperationDetail,
	run: () => Promise<HackerNewsEntry[]>,
): Promise<HackerNewsEntry[]> => {
	const startedAt = Date.now()

	try {
		const entries = await run()

		repository.save({
			...detail,
			status: "success",
			entryCount: entries.length,
			durationMs: Date.now() - startedAt,
		})

		return entries
	} catch (error) {
		repository.save({
			...detail,
			status: "error",
			errorMessage: describeError(error),
			entryCount: 0,
			durationMs: Date.now() - startedAt,
		})

		throw error
	}
}
