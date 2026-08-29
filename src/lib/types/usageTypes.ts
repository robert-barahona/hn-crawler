import type { FilterType } from "@/lib/types/filterTypes"

// Like FILTER_TYPES, these feed the CHECK constraints in the schema
export const OPERATIONS = ["crawl", "filter"] as const
type Operation = (typeof OPERATIONS)[number]

export const STATUSES = ["success", "error"] as const
type Status = (typeof STATUSES)[number]

// Ensures the tags below are values that exist
type WithOperation<O extends Operation> = { readonly operation: O }
type WithStatus<S extends Status> = { readonly status: S }

// A filter run names its filter type; a crawl has none to name
export type OperationDetail =
	| WithOperation<"crawl">
	| (WithOperation<"filter"> & { readonly filterType: FilterType })

// A failed run explains itself; a successful one has nothing to explain
type StatusDetail =
	| WithStatus<"success">
	| (WithStatus<"error"> & { readonly errorMessage: string })

export type UsageLogInput = OperationDetail &
	StatusDetail & {
		readonly entryCount: number // how many entries the run produced
		readonly durationMs: number
	}

// The shape the table actually stores
export interface UsageLog {
	readonly id: number
	readonly createdAt: string
	readonly operation: Operation
	readonly filterType: FilterType | null
	readonly entryCount: number
	readonly durationMs: number
	readonly status: Status
	readonly errorMessage: string | null
}
