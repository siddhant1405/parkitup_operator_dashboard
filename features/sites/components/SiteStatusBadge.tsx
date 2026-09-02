import { cn } from "@/lib/utils"
import type { Site } from "@/types/site"

export function SiteStatusBadge({ status }: { status: Site["status"] }) {
  const isSubmitted = status === "submitted"

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-md px-2 font-heading text-xs font-semibold tracking-wide uppercase",
        isSubmitted
          ? "bg-badge-submitted-bg text-badge-submitted-fg"
          : "bg-badge-draft-bg text-badge-draft-fg"
      )}
    >
      {isSubmitted ? "Submitted" : "Draft"}
    </span>
  )
}
