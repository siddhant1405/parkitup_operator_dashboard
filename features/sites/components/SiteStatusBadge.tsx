import { cn } from "@/lib/utils"
import type { Site } from "@/types/site"

const badgeBase =
  "inline-flex h-6 items-center rounded-md px-2 font-heading text-xs font-semibold tracking-wide uppercase"

const statusBadgeStyles: Record<
  Site["status"],
  { className: string; label: string }
> = {
  draft: {
    className: "bg-badge-draft-bg text-badge-draft-fg",
    label: "Draft",
  },
  submitted: {
    className: "bg-badge-submitted-bg text-badge-submitted-fg",
    label: "Submitted",
  },
  active: {
    className: "bg-badge-active-bg text-badge-active-fg",
    label: "Active",
  },
  inactive: {
    className: "bg-badge-inactive-bg text-badge-inactive-fg",
    label: "Inactive",
  },
}

export function SiteStatusBadge({ status }: { status: Site["status"] }) {
  const style = statusBadgeStyles[status]

  return <span className={cn(badgeBase, style.className)}>{style.label}</span>
}
