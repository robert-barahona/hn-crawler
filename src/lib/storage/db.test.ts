import type { Database } from "better-sqlite3"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { createConnection } from "@/lib/storage/db"

interface ColumnInfo {
	readonly name: string
	readonly type: string
	readonly notnull: number
}

// `operation` and `status` are typed as plain strings on purpose: these tests
// need to push values the CHECK constraints are supposed to reject
interface UsageLogRow {
	readonly createdAt: string
	readonly operation: string
	readonly filterType: string | null
	readonly entryCount: number
	readonly durationMs: number
	readonly status: string
	readonly errorMessage: string | null
}

// A row every constraint accepts. Each test overrides only the columns it is exercising
const VALID_CRAWL: UsageLogRow = {
	createdAt: "2026-08-27T10:00:00.000Z",
	operation: "crawl",
	filterType: null,
	entryCount: 30,
	durationMs: 12,
	status: "success",
	errorMessage: null,
}

const insertLog = (
	db: Database,
	overrides: Partial<UsageLogRow> = {},
): void => {
	db.prepare<UsageLogRow>(
		`INSERT INTO usage_logs
			(created_at, operation, filter_type, entry_count, duration_ms, status, error_message)
		VALUES (@createdAt, @operation, @filterType, @entryCount, @durationMs, @status, @errorMessage)`,
	).run({ ...VALID_CRAWL, ...overrides })
}

const countLogs = (db: Database): number =>
	db
		.prepare<[], { total: number }>("SELECT COUNT(*) AS total FROM usage_logs")
		.get()?.total ?? 0

describe("createConnection", () => {
	let db: Database

	beforeEach(() => {
		db = createConnection(":memory:")
	})

	afterEach(() => {
		db.close()
	})

	it("creates the usage_logs table with the expected columns", () => {
		const columns = db.pragma("table_info(usage_logs)") as ColumnInfo[]

		expect(columns.map((column) => column.name)).toEqual([
			"id",
			"created_at",
			"operation",
			"filter_type",
			"entry_count",
			"duration_ms",
			"status",
			"error_message",
		])
	})

	it("is idempotent, so re-applying the schema keeps existing rows", () => {
		insertLog(db)

		db.exec("CREATE TABLE IF NOT EXISTS usage_logs (id INTEGER PRIMARY KEY)")

		expect(countLogs(db)).toBe(1)
	})

	it("accepts a crawl without a filter type and a filter run with one", () => {
		insertLog(db, { operation: "crawl", filterType: null })
		insertLog(db, {
			operation: "filter",
			filterType: "five-words-or-fewer-by-points",
		})

		expect(countLogs(db)).toBe(2)
	})

	it("accepts a failed run that explains itself", () => {
		insertLog(db, {
			status: "error",
			errorMessage: "https://news.ycombinator.com/ responded with 503.",
		})

		expect(countLogs(db)).toBe(1)
	})

	it("rejects an unknown operation", () => {
		expect(() => insertLog(db, { operation: "purge" })).toThrow(
			/CHECK constraint failed/,
		)
	})

	it("rejects an unknown filter type", () => {
		expect(() =>
			insertLog(db, { operation: "filter", filterType: "by-vibes" }),
		).toThrow(/CHECK constraint failed/)
	})

	it("rejects a filter run that does not name its filter type", () => {
		expect(() =>
			insertLog(db, { operation: "filter", filterType: null }),
		).toThrow(/CHECK constraint failed/)
	})

	it("rejects a crawl that names a filter type", () => {
		expect(() =>
			insertLog(db, {
				operation: "crawl",
				filterType: "five-words-or-fewer-by-points",
			}),
		).toThrow(/CHECK constraint failed/)
	})

	it("rejects a failed run without an error message", () => {
		expect(() =>
			insertLog(db, { status: "error", errorMessage: null }),
		).toThrow(/CHECK constraint failed/)
	})

	it("rejects a successful run that carries an error message", () => {
		expect(() =>
			insertLog(db, { status: "success", errorMessage: "boom" }),
		).toThrow(/CHECK constraint failed/)
	})
})
