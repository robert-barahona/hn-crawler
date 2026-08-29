import type { FC } from "react"
import { TableCell } from "@/components/ui/TableCell"
import type { HackerNewsEntry } from "@/lib/types/crawlerTypes"

interface EntryTableProps {
	readonly entries: readonly HackerNewsEntry[]
}

export const EntryTable: FC<EntryTableProps> = ({ entries }) => (
	<div className="min-h-0 overflow-auto rounded-xl border border-border bg-surface-secondary">
		<table className="w-full min-w-lg border-collapse text-sm">
			<thead className="text-text-muted text-xs uppercase tracking-wider">
				<tr>
					<TableCell align="right" className="w-16" heading>
						#
					</TableCell>
					<TableCell heading>Title</TableCell>
					<TableCell align="right" className="w-28" heading>
						Points
					</TableCell>
					<TableCell align="right" className="w-28" heading>
						Comments
					</TableCell>
				</tr>
			</thead>
			<tbody>
				{entries.map((entry) => (
					<tr
						className="border-border/60 border-b last:border-b-0 hover:bg-surface-primary"
						key={entry.number}
					>
						<TableCell align="right" className="font-mono text-text-muted">
							{entry.number}
						</TableCell>
						<TableCell className="text-text-primary">{entry.title}</TableCell>
						<TableCell align="right" className="text-text-secondary">
							{entry.points}
						</TableCell>
						<TableCell align="right" className="text-text-secondary">
							{entry.comments}
						</TableCell>
					</tr>
				))}
			</tbody>
		</table>
	</div>
)
