import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Joins conditional class names and lets the last one win when two Tailwind
// utilities from the same group collide, which class order alone does not settle
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))
