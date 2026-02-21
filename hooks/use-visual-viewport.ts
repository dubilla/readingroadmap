'use client'

import { useEffect } from "react"

/**
 * Tracks window.visualViewport and sets a CSS custom property
 * `--visual-viewport-height` on :root. When the mobile keyboard opens
 * the visual viewport shrinks — this lets CSS like
 * `max-h-[calc(var(--visual-viewport-height,85dvh)-4rem)]` keep modal
 * content above the keyboard.
 *
 * Listens to both `resize` (keyboard open/close) and `scroll` (iOS
 * Safari shifts the visual viewport within the layout viewport) so the
 * value stays accurate throughout the keyboard lifecycle.
 */
export function useVisualViewport() {
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    function update() {
      document.documentElement.style.setProperty(
        "--visual-viewport-height",
        `${vv!.height}px`
      )
    }

    update()
    vv.addEventListener("resize", update)
    vv.addEventListener("scroll", update)

    return () => {
      vv.removeEventListener("resize", update)
      vv.removeEventListener("scroll", update)
      document.documentElement.style.removeProperty("--visual-viewport-height")
    }
  }, [])
}
