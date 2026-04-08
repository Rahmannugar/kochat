"use client"

import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"

type CursorPaginationProps = {
  canGoBack: boolean
  canGoNext: boolean
  isBusy?: boolean
  backLabel?: string
  nextLabel?: string
  onBack: () => void
  onNext: () => void
}

export const CursorPagination = ({
  canGoBack,
  canGoNext,
  isBusy = false,
  backLabel = "Back",
  nextLabel = "Next",
  onBack,
  onNext,
}: CursorPaginationProps) => {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <Button
        type="button"
        variant="outline"
        className="w-full rounded-full sm:w-auto"
        disabled={!canGoBack || isBusy}
        onClick={onBack}
      >
        <ArrowLeftIcon size={16} weight="bold" />
        {backLabel}
      </Button>

      <Button
        type="button"
        variant="outline"
        className="w-full rounded-full sm:w-auto"
        disabled={!canGoNext || isBusy}
        onClick={onNext}
      >
        {isBusy ? "Loading..." : nextLabel}
        <ArrowRightIcon size={16} weight="bold" />
      </Button>
    </div>
  )
}
