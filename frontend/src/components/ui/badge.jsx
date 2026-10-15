import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-amber-500/10 text-amber-400 border-amber-500/20",
        secondary: "border-transparent bg-zinc-800 text-zinc-300",
        destructive: "border-transparent bg-red-950/60 text-red-400 border-red-500/30",
        outline: "text-zinc-400 border-zinc-800",
        emerald: "border-transparent bg-emerald-950/50 text-emerald-400 border-emerald-500/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
