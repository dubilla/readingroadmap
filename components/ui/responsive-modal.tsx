'use client'

import * as React from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { useVisualViewport } from "@/hooks/use-visual-viewport"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

interface ResponsiveModalContextValue {
  isMobile: boolean
}

const ResponsiveModalContext = React.createContext<ResponsiveModalContextValue>({
  isMobile: false,
})

function useResponsiveModal() {
  return React.useContext(ResponsiveModalContext)
}

// --- Root ---

interface ResponsiveModalProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

function ResponsiveModal({ children, open, onOpenChange }: ResponsiveModalProps) {
  const isMobile = useIsMobile()
  useVisualViewport()

  const contextValue = React.useMemo(() => ({ isMobile }), [isMobile])

  if (isMobile) {
    return (
      <ResponsiveModalContext.Provider value={contextValue}>
        <Drawer open={open} onOpenChange={onOpenChange}>
          {children}
        </Drawer>
      </ResponsiveModalContext.Provider>
    )
  }

  return (
    <ResponsiveModalContext.Provider value={contextValue}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        {children}
      </Dialog>
    </ResponsiveModalContext.Provider>
  )
}

// --- Trigger ---

const ResponsiveModalTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof DialogTrigger>
>(({ ...props }, ref) => {
  const { isMobile } = useResponsiveModal()

  if (isMobile) {
    return <DrawerTrigger ref={ref} {...props} />
  }

  return <DialogTrigger ref={ref} {...props} />
})
ResponsiveModalTrigger.displayName = "ResponsiveModalTrigger"

// --- Close ---

const ResponsiveModalClose = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof DialogClose>
>(({ ...props }, ref) => {
  const { isMobile } = useResponsiveModal()

  if (isMobile) {
    return <DrawerClose ref={ref} {...props} />
  }

  return <DialogClose ref={ref} {...props} />
})
ResponsiveModalClose.displayName = "ResponsiveModalClose"

// --- Content ---

const ResponsiveModalContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof DialogContent>
>(({ className, children, ...props }, ref) => {
  const { isMobile } = useResponsiveModal()

  if (isMobile) {
    return (
      <DrawerContent ref={ref} className={cn(className)}>
        <div className="overflow-y-auto max-h-[calc(var(--visual-viewport-height,85dvh)-4rem)]">
          {children}
        </div>
      </DrawerContent>
    )
  }

  return (
    <DialogContent ref={ref} className={cn(className)} {...props}>
      {children}
    </DialogContent>
  )
})
ResponsiveModalContent.displayName = "ResponsiveModalContent"

// --- Header ---

function ResponsiveModalHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { isMobile } = useResponsiveModal()

  if (isMobile) {
    return <DrawerHeader className={cn(className)} {...props} />
  }

  return <DialogHeader className={cn(className)} {...props} />
}
ResponsiveModalHeader.displayName = "ResponsiveModalHeader"

// --- Footer ---

function ResponsiveModalFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { isMobile } = useResponsiveModal()

  if (isMobile) {
    return <DrawerFooter className={cn(className)} {...props} />
  }

  return <DialogFooter className={cn(className)} {...props} />
}
ResponsiveModalFooter.displayName = "ResponsiveModalFooter"

// --- Title ---

const ResponsiveModalTitle = React.forwardRef<
  HTMLHeadingElement,
  React.ComponentPropsWithoutRef<typeof DialogTitle>
>(({ className, ...props }, ref) => {
  const { isMobile } = useResponsiveModal()

  if (isMobile) {
    return <DrawerTitle ref={ref} className={cn(className)} {...props} />
  }

  return <DialogTitle ref={ref} className={cn(className)} {...props} />
})
ResponsiveModalTitle.displayName = "ResponsiveModalTitle"

// --- Description ---

const ResponsiveModalDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<typeof DialogDescription>
>(({ className, ...props }, ref) => {
  const { isMobile } = useResponsiveModal()

  if (isMobile) {
    return <DrawerDescription ref={ref} className={cn(className)} {...props} />
  }

  return <DialogDescription ref={ref} className={cn(className)} {...props} />
})
ResponsiveModalDescription.displayName = "ResponsiveModalDescription"

export {
  ResponsiveModal,
  ResponsiveModalTrigger,
  ResponsiveModalClose,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalFooter,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
  useResponsiveModal,
}
