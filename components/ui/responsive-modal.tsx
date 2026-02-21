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
  const scrollRef = React.useRef<HTMLDivElement>(null)

  // Fix 1: Prevent iOS Safari from scrolling the *page* when the keyboard
  // opens. On iOS, position:fixed elements move with page scroll when the
  // keyboard is up, which shoots the drawer off the top of the viewport.
  React.useEffect(() => {
    if (!isMobile) return

    const vv = window.visualViewport
    if (!vv) return

    function resetPageScroll() {
      if (window.scrollY !== 0) {
        window.scrollTo(0, 0)
      }
    }

    vv.addEventListener("resize", resetPageScroll)
    vv.addEventListener("scroll", resetPageScroll)

    return () => {
      vv.removeEventListener("resize", resetPageScroll)
      vv.removeEventListener("scroll", resetPageScroll)
    }
  }, [isMobile])

  // Fix 2: When an input inside the drawer receives focus, scroll it into
  // view *within the drawer's own scroll container* rather than letting
  // the browser scroll the page.
  React.useEffect(() => {
    if (!isMobile) return
    const scrollEl = scrollRef.current
    if (!scrollEl) return

    function handleFocusIn(e: FocusEvent) {
      const target = e.target as HTMLElement
      if (!target.matches("input, textarea, select, [contenteditable]")) return

      // Wait for the keyboard open animation to settle so getBoundingClientRect
      // reflects the final position.
      setTimeout(() => {
        window.scrollTo(0, 0)

        const targetRect = target.getBoundingClientRect()
        const containerRect = scrollEl!.getBoundingClientRect()

        if (targetRect.top < containerRect.top) {
          scrollEl!.scrollTop -= containerRect.top - targetRect.top + 16
        } else if (targetRect.bottom > containerRect.bottom) {
          scrollEl!.scrollTop += targetRect.bottom - containerRect.bottom + 16
        }
      }, 300)
    }

    scrollEl.addEventListener("focusin", handleFocusIn)
    return () => scrollEl.removeEventListener("focusin", handleFocusIn)
  }, [isMobile])

  if (isMobile) {
    return (
      // Fix 3: Push the drawer up above the keyboard via --keyboard-offset.
      // The inline style overrides Tailwind's `bottom-0` on DrawerContent.
      // vaul uses `transform` for its drag gesture, so changing `bottom` is safe.
      <DrawerContent
        ref={ref}
        className={cn(className)}
        style={{ bottom: "var(--keyboard-offset, 0px)", transition: "bottom 100ms ease-out" }}
      >
        <div
          ref={scrollRef}
          className="overflow-y-auto max-h-[calc(var(--visual-viewport-height,85dvh)-4rem)]"
        >
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
