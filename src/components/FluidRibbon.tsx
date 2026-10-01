"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface FluidRibbonProps {
  activeFlavor: number;
  flavors: {
    id: string;
    color: string;
    bgImage: string;
    bg?: {
      left: string;
      right: string;
      accent: string;
    };
  }[];
}

export default function FluidRibbon({ activeFlavor, flavors }: FluidRibbonProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const turbRef = useRef<SVGFETurbulenceElement>(null);
  const dispRef = useRef<SVGFEDisplacementMapElement>(null);
  const liquidPathRef = useRef<SVGPathElement>(null);
  const currentStripeRef = useRef<SVGPolygonElement>(null);
  const nextStripeRef = useRef<SVGPolygonElement>(null);
  const prevFlavorRef = useRef(activeFlavor);

  useEffect(() => {
    if (activeFlavor === prevFlavorRef.current) return;

    const fromColor = flavors[prevFlavorRef.current]?.color || "#ff5859";
    const toColor = flavors[activeFlavor]?.color || "#a1d782";
    const direction = activeFlavor > prevFlavorRef.current ? 1 : -1;

    // Set a cleaner diagonal slide instead of a fade-through, while keeping a subtle
    // liquid feel through a short turbulence pulse.
    const animState = {
      turbScale: 0,
      turbFreq: 0.015,
    };

    const tl = gsap.timeline({
      onUpdate: () => {
        if (dispRef.current) {
          dispRef.current.scale.baseVal = animState.turbScale;
        }
        if (turbRef.current) {
          turbRef.current.baseFrequencyX.baseVal = animState.turbFreq;
          turbRef.current.baseFrequencyY.baseVal = animState.turbFreq * 1.6;
        }
      },
    });

    tl.to(animState, {
      turbScale: 16,
      turbFreq: 0.022,
      duration: 0.28,
      ease: "power2.out",
    }).to(animState, {
      turbScale: 0,
      turbFreq: 0.012,
      duration: 0.52,
      ease: "power2.inOut",
    });

    // Direct ribbon motion that matches the reference: one panel shifts in while the
    // previous one slides away, without a diffuse fade-through.
    if (currentStripeRef.current && nextStripeRef.current) {
      gsap.fromTo(
        nextStripeRef.current,
        {
          x: 180 * direction,
          opacity: 0.88,
        },
        {
          x: 0,
          opacity: 1,
          duration: 0.92,
          ease: "power2.out",
        }
      );

      gsap.fromTo(
        currentStripeRef.current,
        {
          x: 0,
          opacity: 1,
        },
        {
          x: -180 * direction,
          opacity: 0.18,
          duration: 0.8,
          ease: "power2.inOut",
        }
      );
    }

    prevFlavorRef.current = activeFlavor;
  }, [activeFlavor, flavors]);

  const currentFlavor = flavors[activeFlavor] || flavors[0];
  const prevFlavor = flavors[prevFlavorRef.current] || flavors[0];
  const currentColor = currentFlavor.color || "#ff5859";
  const prevColor = prevFlavor.color || "#ff5859";
  const leftBase = currentFlavor.bg?.left || "#d9d5ef";
  const rightBase = currentFlavor.bg?.right || "#f5f4f0";
  const accentBase = currentFlavor.bg?.accent || "#c7d3d0";

  return (
    <div
      className="fluid-ribbon-container"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 1,
        overflow: "hidden",
        pointerEvents: "none",
        background: leftBase,
      }}
      aria-hidden="true"
    >
      <svg
        ref={svgRef}
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
      >
        <defs>
          <filter id="kombuLiquidFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              ref={turbRef}
              type="fractalNoise"
              baseFrequency="0.015"
              numOctaves="3"
              result="noise"
            />
            <feDisplacementMap
              ref={dispRef}
              in="SourceGraphic"
              in2="noise"
              scale="0"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>

        <rect x="0" y="0" width="1440" height="900" fill={leftBase} />

        <g filter="url(#kombuLiquidFilter)">
          <polygon
            points="620,0 1440,0 1440,900 180,900"
            fill={rightBase}
          />

          <polygon
            ref={currentStripeRef}
            points="620,-80 840,-80 420,980 200,980"
            fill={prevColor}
            opacity={1}
          />

          <polygon
            ref={nextStripeRef}
            points="620,-80 840,-80 420,980 200,980"
            fill={currentColor}
            opacity={1}
          />

          <polygon
            points="1260,-80 1480,-80 1060,980 840,980"
            fill={accentBase}
            opacity={0.8}
          />
        </g>
      </svg>
    </div>
  );
}
