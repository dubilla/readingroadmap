'use client'

import { useEffect } from "react"

/**
 * Tracks window.visualViewport and sets a CSS custom property
 * `--visual-viewport-height` on the document root. When the mobile
 * keyboard opens, the visual viewport shrinks — this lets CSS like
 * `max-h-[calc(var(--visual-viewport-height,85dvh)-4rem)]` respond
 * to the keyboard without content being obscured.
 */
export function useVisualViewport() {
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    function onResize() {
      document.documentElement.style.setProperty(
        "--visual-viewport-height",
        `${vv!.height}px`
      )
    }

    onResize()
    vv.addEventListener("resize", onResize)

    return () => {
      vv.removeEventListener("resize", onResize)
      document.documentElement.style.removeProperty("--visual-viewport-height")
    }
  }, [])
}
