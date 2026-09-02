"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { VariantProps } from "class-variance-authority"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button, type buttonVariants } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useDeleteSite } from "@/features/sites/api/mutations"

interface DeleteSiteButtonProps {
  siteId: string
  className?: string
  label?: string
  size?: VariantProps<typeof buttonVariants>["size"]
  iconOnly?: boolean
}

export function DeleteSiteButton({
  siteId,
  className,
  label = "Delete",
  size = "sm",
  iconOnly = false,
}: DeleteSiteButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const deleteSite = useDeleteSite()

  async function handleDelete() {
    try {
      await deleteSite.mutateAsync(siteId)
      setOpen(false)
      toast.success("Site deleted.")
      router.push("/sites")
    } catch {
      toast.error("Couldn't delete this site. Try again.")
    }
  }

  function openConfirm(event: React.MouseEvent) {
    event.stopPropagation()
    event.preventDefault()
    setOpen(true)
  }

  const trigger = iconOnly ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="destructive"
          size="icon-sm"
          className={className}
          onClick={openConfirm}
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span className="sr-only">Delete</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>Delete</TooltipContent>
    </Tooltip>
  ) : (
    <Button
      type="button"
      variant="destructive"
      size={size}
      className={cn(className)}
      onClick={openConfirm}
    >
      <Trash2 className="h-4 w-4" />
      {label}
    </Button>
  )

  return (
    <>
      {trigger}

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent onClick={(event) => event.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this site?</AlertDialogTitle>
            <AlertDialogDescription>
              This can&apos;t be undone from your portal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteSite.isPending}
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
