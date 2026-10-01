import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/*
 * Single owner of `document.body.style.backgroundColor`.
 *
 * Several slices change the page background as you scroll. When each slice tweened
 * `body` on its own scrubbed timeline, the lagging scrubs raced each other and the
 * last one to finish catching up won (e.g. the top of the page stayed seafoam after
 * scrolling back up). Instead, each slice registers a segment here, and one paint
 * function derives the color purely from scroll progress.
 */

type Segment = {
  trigger: ScrollTrigger;
  order: number;
  /** Sub-range of the trigger's progress over which the color changes. */
  range: [number, number];
  interpolate: (p: number) => string;
};

const segments = new Set<Segment>();

function paint() {
  const sorted = Array.from(segments).sort((a, b) => b.order - a.order);
  // The furthest-down segment that has started owns the color; otherwise the
  // top-most segment's starting color applies.
  const active = sorted.find((s) => s.trigger.progress > 0) ?? sorted[sorted.length - 1];
  if (!active) return;
  const [a, b] = active.range;
  const p = gsap.utils.clamp(0, 1, (active.trigger.progress - a) / (b - a));
  document.body.style.backgroundColor = active.interpolate(p);
}

/**
 * Registers a background segment. `order` is the slice's position on the page
 * (higher = further down). Returns a cleanup function.
 */
export function registerBackgroundSegment({
  order,
  from,
  to,
  range = [0, 1],
  ...triggerVars
}: {
  order: number;
  from: string;
  to: string;
  range?: [number, number];
} & Pick<ScrollTrigger.Vars, "trigger" | "start" | "end" | "endTrigger">) {
  const segment = {
    order,
    range,
    interpolate: gsap.utils.interpolate(from, to),
  } as Segment;

  segment.trigger = ScrollTrigger.create({
    ...triggerVars,
    onUpdate: paint,
    onRefresh: paint,
  });
  segments.add(segment);
  paint();

  return () => {
    segments.delete(segment);
    segment.trigger.kill();
  };
}
