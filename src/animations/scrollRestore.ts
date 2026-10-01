import { ScrollTrigger } from "gsap/ScrollTrigger";

const KEY = "fizzy-scroll-y";

/*
 * Pinned slices (SkyDive, AlternatingText, Carousel) add their pin spacers only after
 * their async R3F Views mount, so on reload the browser's native scroll restoration
 * runs against a page that is thousands of pixels too short and clamps the position.
 * Restore manually, once, on the first ScrollTrigger refresh where every listed scene
 * is pinned (restoring against an intermediate layout would land in the wrong scene).
 * Returns a cleanup function.
 */
export function restoreScrollAfterPins(pinnedSelectors: string[]) {
  if (typeof window === "undefined") return () => {};

  const previous = history.scrollRestoration;
  history.scrollRestoration = "manual";

  const save = () => {
    try {
      sessionStorage.setItem(KEY, String(Math.round(window.scrollY)));
    } catch {
      // Storage unavailable: fall back to starting at the top.
    }
  };

  let target: number | null = null;
  try {
    const stored = sessionStorage.getItem(KEY);
    if (stored !== null) target = Number(stored);
  } catch {
    target = null;
  }

  const onRefresh = () => {
    if (target === null || !Number.isFinite(target)) return;
    const allPinned = pinnedSelectors.every((selector) =>
      document.querySelector(selector)?.parentElement?.classList.contains("pin-spacer"),
    );
    if (!allPinned) return; // a scene hasn't mounted its pin yet; wait for its refresh
    window.scrollTo(0, target);
    target = null;
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      // ignore
    }
    ScrollTrigger.update();
  };

  window.addEventListener("pagehide", save);
  ScrollTrigger.addEventListener("refresh", onRefresh);
  onRefresh();

  return () => {
    window.removeEventListener("pagehide", save);
    ScrollTrigger.removeEventListener("refresh", onRefresh);
    history.scrollRestoration = previous;
  };
}
