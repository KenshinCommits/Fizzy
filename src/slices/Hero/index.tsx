"use client";

import { asText, Content } from "@prismicio/client";
import { PrismicNextImage } from "@prismicio/next";
import { PrismicRichText, SliceComponentProps } from "@prismicio/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { View } from "@react-three/drei";

import { Bounded } from "@/components/Bounded";
import Button from "@/components/Button";
import { TextSplitter } from "@/components/TextSplitter";
import Scene from "./Scene";
import { Bubbles } from "./Bubbles";
import { useStore } from "@/hooks/useStore";
import { useMediaQuery } from "@/hooks/useMediaQuery";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Props for `Hero`.
 */
export type HeroProps = SliceComponentProps<Content.HeroSlice>;

/**
 * Component for "Hero" Slices.
 */
const Hero = ({ slice }: HeroProps): JSX.Element => {
  const ready = useStore((state) => state.ready);
  const isDesktop = useMediaQuery("(min-width: 768px)", true);

  useGSAP(
    () => {
      if (!ready && isDesktop) return;

      const introTl = gsap.timeline();

      introTl
        .set(".hero", { opacity: 1 })
        .from(".hero-header-word", {
          scale: 3,
          opacity: 0,
          ease: "power4.in",
          delay: 0.3,
          stagger: 1,
        })
        .from(
          ".hero-subheading",
          {
            opacity: 0,
            y: 30,
          },
          "+=.8",
        )
        .from(".hero-body", {
          opacity: 0,
          y: 10,
        })
        .from(".hero-button", {
          opacity: 0,
          y: 10,
          duration: 0.6,
        });

      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom bottom",
          scrub: 1.5,
        },
      });

      scrollTl
        .fromTo(
          "body",
          {
            backgroundColor: "#FFF9D0",
          },
          {
            backgroundColor: "#ACE2E1", // Transition to seafoam
            overwrite: "auto",
          },
          1,
        )
        .from(".text-side-heading .split-char", {
          scale: 1.3,
          y: 40,
          rotate: -25,
          opacity: 0,
          stagger: 0.1,
          ease: "back.out(3)",
          duration: 0.5,
        })
        .from(".text-side-body", {
          y: 20,
          opacity: 0,
        });
    },
    { dependencies: [ready, isDesktop] },
  );

  return (
    <Bounded
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className="hero relative opacity-0"
    >
      {isDesktop && (
        <View className="hero-scene pointer-events-none sticky top-0 z-50 -mt-[100vh] hidden h-screen w-screen md:block">
          <Scene />
          <Bubbles count={300} speed={2} repeat={true} />
        </View>
      )}

      <Button
        buttonLink="/login?next=/shop"
        buttonText="Shop Now"
        className="hero-button absolute right-0 top-[11.625rem] z-[100] inline-flex items-center justify-center whitespace-nowrap !mt-0 !h-[3.25rem] !w-[9.5rem] origin-top-right rotate-90 !rounded-lg px-3 py-2 text-base md:px-5 md:py-3 md:text-xl"
      />

      <div className="grid">
        <div className="grid h-screen place-items-center">
          <div className="grid auto-rows-min place-items-center text-center">
            <h1 className="hero-header text-7xl font-black uppercase leading-[.8] text-brand-navy md:text-[9rem] lg:text-[13rem]">
              <TextSplitter
                text="Fruity. Fresh. Fizzy."
                wordDisplayStyle="block"
                className="hero-header-word"
              />
            </h1>
            <div className="hero-subheading mt-12 text-5xl font-semibold text-brand-navy lg:text-6xl">
              GOOD VIBES IN EVERY SIP.
            </div>
            <div className="hero-body text-2xl font-normal text-brand-navy mt-4">
              A modern canned beverage brand featuring craft sodas, sparkling fruit juices, and summer coolers.
            </div>
            <Button
              buttonLink="/login?next=/shop"
              buttonText="Shop Now"
              className="hero-button mt-12"
            />
          </div>
        </div>

        <div className="text-side relative z-20 grid h-screen items-center gap-4 md:grid-cols-2 px-8 md:px-16">
          <div className="max-w-xl">
            <h2 className="text-side-heading text-balance text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tight text-brand-navy">
              <TextSplitter text="FRESH. FRUITY. FIZZY." />
            </h2>
            <div className="text-side-body mt-4 text-balance text-base md:text-lg font-bold uppercase tracking-wider text-brand-navy opacity-80">
              <p>GOOD VIBES IN EVERY SIP.</p>
            </div>
          </div>
        </div>
      </div>
    </Bounded>
  );
};

export default Hero;
