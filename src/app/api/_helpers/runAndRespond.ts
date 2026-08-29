import { jsonResponse } from "@/app/api/_helpers/jsonResponse"
import { toErrorResponse } from "@/app/api/_helpers/toErrorResponse"
import { getDb } from "@/lib/storage/db"
import { UsageRepository } from "@/lib/storage/UsageRepository"
import type { HackerNewsEntry } from "@/lib/types/crawlerTypes"
import type { OperationDetail } from "@/lib/types/usageTypes"
import { recordUsage } from "@/lib/usage/recordUsage"

export const runAndRespond = async (
	detail: OperationDetail,
	run: () => Promise<HackerNewsEntry[]>,
): Promise<Response> => {
	try {
		const repository = new UsageRepository(getDb())

		return jsonResponse(await recordUsage(repository, detail, run))
	} catch (error) {
		return toErrorResponse(error)
	}
}
