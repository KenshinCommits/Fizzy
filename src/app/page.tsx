import { Metadata } from "next";

import { SliceZone } from "@prismicio/react";
import * as prismic from "@prismicio/client";

import { createClient } from "@/prismicio";
import { components } from "@/slices";

// This component renders your homepage.
//
// Use Next's generateMetadata function to render page metadata.
//
// Use the SliceZone to render the content of the page.

import Hero from "@/slices/Hero";
import SkyDive from "@/slices/SkyDive";
import Carousel from "@/slices/Carousel";

export const metadata: Metadata = {
  title: "FIZZY | Cooler Sips. Bigger Days.",
  description: "A modern canned beverage brand featuring craft sodas, sparkling fruit juices, and summer coolers.",
};

export default function Index() {
  const dummySlice = {
    slice_type: "hero",
    variation: "default",
    primary: {}
  } as any;

  return (
    <main>
      <Hero slice={dummySlice} index={0} slices={[]} context={{}} />
      <SkyDive slice={dummySlice} index={1} slices={[]} context={{}} />
      <Carousel slice={dummySlice} index={2} slices={[]} context={{}} />
    </main>
  );
}
