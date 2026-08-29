import type { FC, ReactNode } from "react"
import { cn } from "@/utils/cn"

interface PanelProps {
	readonly children: ReactNode
	readonly className?: string
	readonly role?: "alert"
}

export const Panel: FC<PanelProps> = ({ children, className, role }) => (
	<div
		className={cn(
			"rounded-xl border border-border bg-surface-secondary px-4 py-8 text-center text-sm text-text-muted",
			className,
		)}
		role={role}
	>
		{children}
	</div>
)
