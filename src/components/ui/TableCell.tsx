import type { FC, ReactNode } from "react"
import { cn } from "@/utils/cn"

type CellAlign = "left" | "right"

const ALIGNMENT: Record<CellAlign, string> = {
	left: "text-left",
	right: "text-right tabular-nums",
}

interface TableCellProps {
	readonly align?: CellAlign
	readonly children: ReactNode
	readonly className?: string
	readonly heading?: boolean
}

export const TableCell: FC<TableCellProps> = ({
	align = "left",
	children,
	className,
	heading = false,
}) => {
	const classes = cn(
		"px-4 py-3",
		ALIGNMENT[align],
		heading &&
			"sticky top-0 z-10 bg-surface-secondary font-medium shadow-[inset_0_-1px_0_var(--color-border)]",
		className,
	)

	return heading ? (
		<th className={classes} scope="col">
			{children}
		</th>
	) : (
		<td className={classes}>{children}</td>
	)
}
