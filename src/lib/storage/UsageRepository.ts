import type { Database } from "better-sqlite3"
import type { UsageLog, UsageLogInput } from "@/lib/types/usageTypes"

const DEFAULT_LIMIT = 50

// Aliasing the columns to their domain names is what lets a row arrive as a `UsageLog` already
const USAGE_LOG_COLUMNS = `
	id,
	created_at    AS createdAt,
	operation,
	filter_type   AS filterType,
	entry_count   AS entryCount,
	duration_ms   AS durationMs,
	status,
	error_message AS errorMessage`

// Records what the app did and reads it back
export class UsageRepository {
	constructor(private readonly db: Database) {}

	save(input: UsageLogInput): UsageLog {
		const log = this.db
			.prepare<Record<string, string | number | null>, UsageLog>(
				`INSERT INTO usage_logs
					(created_at, operation, filter_type, entry_count, duration_ms, status, error_message)
				VALUES (@createdAt, @operation, @filterType, @entryCount, @durationMs, @status, @errorMessage)
				RETURNING ${USAGE_LOG_COLUMNS}`,
			)
			.get({
				filterType: null, // A crawl leaves `filterType` absent rather than null
				errorMessage: null, // A success does the same with `errorMessage`
				...input,
				createdAt: new Date().toISOString(),
			})

		if (!log) {
			throw new Error("Inserting a usage log returned no row.")
		}

		return log
	}

	findRecent(limit: number = DEFAULT_LIMIT): UsageLog[] {
		return this.db
			.prepare<[number], UsageLog>(
				`SELECT ${USAGE_LOG_COLUMNS}
				FROM usage_logs
				ORDER BY created_at DESC, id DESC
				LIMIT ?`,
			)
			.all(limit)
	}
}
