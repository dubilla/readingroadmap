'use client'

import { useEffect } from "react"

/**
 * Tracks window.visualViewport and sets CSS custom properties on :root:
 *
 * --visual-viewport-height  The visual viewport height (shrinks when
 *                           the mobile keyboard opens).
 *
 * --keyboard-offset         How many pixels of the layout viewport are
 *                           hidden behind the keyboard + any browser
 *                           chrome. Used to push fixed-position drawers
 *                           up above the keyboard.
 *
 * Both `resize` and `scroll` events are tracked because iOS Safari
 * scrolls the layout viewport when the keyboard opens, and the offset
 * changes on scroll.
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

      // The keyboard eats space from the bottom of the layout viewport.
      // window.innerHeight is the layout viewport height (stable),
      // vv.height is the visual viewport (shrinks with keyboard),
      // vv.offsetTop is how far the visual viewport has scrolled down
      // inside the layout viewport.
      const keyboardOffset = Math.max(
        0,
        window.innerHeight - vv!.height - vv!.offsetTop
      )
      document.documentElement.style.setProperty(
        "--keyboard-offset",
        `${keyboardOffset}px`
      )
    }

    update()
    vv.addEventListener("resize", update)
    vv.addEventListener("scroll", update)

    return () => {
      vv.removeEventListener("resize", update)
      vv.removeEventListener("scroll", update)
      document.documentElement.style.removeProperty("--visual-viewport-height")
      document.documentElement.style.removeProperty("--keyboard-offset")
    }
  }, [])
}
