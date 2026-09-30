'use client';

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import Lenis from 'lenis';
import InteractiveWatermelon from '@/components/InteractiveWatermelon';

const SceneManager = dynamic(() => import('@/components/3d/SceneManager'), { ssr: false });

export default function Home() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 2,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  return (
    <main className="relative bg-[#FFF9D0]">
      <SceneManager />
      
      {/* 1. HERO */}
      <section className="relative w-full h-[120vh] flex flex-col justify-center items-center text-center px-4 overflow-hidden z-20 pointer-events-none">
        <h1 className="text-[15vw] md:text-[10rem] font-black leading-none tracking-tighter text-brand-red uppercase mix-blend-multiply">
          FIZZY
        </h1>
        <h2 className="text-4xl md:text-7xl font-bold text-brand-navy mt-4 uppercase tracking-wide">
          Watermelon Crush
        </h2>
        <p className="mt-8 text-xl md:text-3xl font-medium text-brand-navy/80">
          Cooler sips. Bigger days.
        </p>
      </section>

      {/* 2. BRAND STORY */}
      <section id="story" className="relative w-full min-h-screen flex items-center justify-start px-6 md:px-24 z-20">
        <div className="max-w-4xl text-left pointer-events-auto">
          <h2 className="text-6xl md:text-8xl font-black text-brand-navy uppercase leading-tight">
            FIZZ YOUR WAY <br />
            THROUGH SUMMER.
          </h2>
          <div className="mt-12 flex flex-col gap-4 text-2xl md:text-4xl font-bold text-brand-red uppercase">
            <span>Real Fruit.</span>
            <span>Sparkling.</span>
            <span>Low Sugar.</span>
            <span>Good Vibes.</span>
          </div>
        </div>
      </section>

      {/* 3. WATERMELON CRUSH */}
      <section className="relative w-full min-h-screen flex items-center justify-end px-6 md:px-24 z-20">
        <div className="max-w-2xl text-right pointer-events-auto">
          <h3 className="text-5xl md:text-7xl font-black text-brand-green uppercase mb-6">
            WATERMELON<br />CRUSH
          </h3>
          <p className="text-2xl md:text-3xl font-semibold text-brand-navy">
            Juicy watermelon. Bright bubbles. Zero boring sips.
          </p>
        </div>
      </section>

      {/* 4. FLAVOURS */}
      <section id="flavours" className="relative w-full min-h-[150vh] flex items-center px-6 md:px-24 bg-brand-cyan/30 z-20 pointer-events-auto">
        <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="md:w-1/2 flex flex-col space-y-6">
            <h2 className="text-6xl font-black text-brand-navy uppercase mb-12">Flavours</h2>
            {['Watermelon Crush', 'Yuzu Citrus Fizz', 'Nami Cola', 'Berry Wave', 'Mango Splash'].map((flavor, i) => (
              <button key={flavor} className={`text-left text-3xl md:text-5xl font-black uppercase transition-all duration-300 ${i === 0 ? 'text-brand-red scale-105 ml-4' : 'text-brand-navy/30 hover:text-brand-navy'}`}>
                {flavor}
              </button>
            ))}
          </div>
          <div className="md:w-1/2 flex justify-center items-center mt-20 md:mt-0">
             {/* The 3D Can will be positioned here by GSAP */}
             <div className="w-full aspect-square border-4 border-dashed border-brand-navy/10 rounded-full flex items-center justify-center opacity-50">
               <span className="text-brand-navy font-bold tracking-widest text-sm uppercase">Flavor Spotlight</span>
             </div>
          </div>
        </div>
      </section>

      {/* 5. BENEFITS */}
      <section id="benefits" className="relative w-full min-h-screen flex flex-col items-center justify-center bg-[#FFF9D0] z-20">
        <h2 className="text-6xl md:text-[8rem] font-black uppercase text-brand-blue mb-16 text-center leading-none">
          Nothing to <br /> hide.
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 w-full max-w-6xl px-6">
          {[
            { title: 'REAL FRUIT', desc: 'No fake syrups.' },
            { title: 'SPARKLING', desc: 'Crisp & bubbly.' },
            { title: 'LOW SUGAR', desc: 'Guilt-free sipping.' },
            { title: 'GOOD VIBES', desc: '100% certified.' }
          ].map(benefit => (
            <div key={benefit.title} className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-brand-cyan mb-6 flex items-center justify-center text-3xl">✨</div>
              <h3 className="text-2xl font-bold text-brand-navy uppercase">{benefit.title}</h3>
              <p className="text-lg text-brand-navy/70 mt-2 font-medium">{benefit.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. PRODUCT / PACK SECTION */}
      <section id="shop" className="relative w-full min-h-screen flex items-center justify-center px-6 py-24 z-20 pointer-events-auto bg-brand-red text-white">
        <div className="max-w-4xl w-full">
          <h2 className="text-5xl md:text-7xl font-black uppercase mb-12 text-center">Stock Up</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {['Single', '6 Pack', '12 Pack'].map((pack, i) => (
                <div key={pack} className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl hover:bg-white/20 transition-colors cursor-pointer group">
                  <h3 className="text-3xl font-black uppercase mb-2">{pack}</h3>
                  <p className="text-xl mb-8 font-medium">${i === 0 ? '3.00' : i === 1 ? '16.00' : '30.00'}</p>
                  <button className="w-full py-4 bg-white text-brand-red font-bold uppercase rounded-full group-hover:scale-105 transition-transform">
                    Add to Cart
                  </button>
                </div>
             ))}
          </div>
        </div>
      </section>

      {/* 7. TESTIMONIALS */}
      <section className="relative w-full py-32 bg-brand-cyan/20 z-20 flex flex-col items-center justify-center text-center px-6">
        <h2 className="text-4xl md:text-6xl font-black text-brand-navy uppercase mb-16">The Word is Out</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
          {[
            { quote: "Finally a soda that doesn't make me feel guilty. Watermelon Crush is elite.", name: "- Sarah J." },
            { quote: "It literally tastes like biting into a cold slice of watermelon.", name: "- Mike T." },
            { quote: "The bubbles. The flavor. The vibes. 10/10.", name: "- Elena R." }
          ].map((t, i) => (
            <div key={i} className="bg-white p-8 rounded-3xl shadow-sm text-left border border-brand-cyan">
              <p className="text-xl font-medium text-brand-navy mb-6">"{t.quote}"</p>
              <p className="font-bold text-brand-blue uppercase tracking-wider">{t.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 8. INTERACTIVE WATERMELON MOMENT */}
      <InteractiveWatermelon />

      {/* 9. FINAL CTA & FOOTER */}
      <footer className="relative w-full min-h-[50vh] flex flex-col items-center justify-center bg-brand-navy text-[#FFF9D0] z-20 pointer-events-auto pt-24 pb-12">
        <h2 className="text-6xl md:text-9xl font-black uppercase mb-4 text-center">KEEP IT FIZZY.</h2>
        <p className="text-2xl md:text-3xl font-semibold mb-12">Chill it. Crack it. Share it.</p>
        <div className="flex space-x-6 mb-24">
          <button className="px-10 py-5 bg-brand-red text-white font-bold text-xl uppercase rounded-full hover:scale-105 transition-transform">
            Shop Fizzy
          </button>
          <button className="px-10 py-5 bg-transparent border-2 border-[#FFF9D0] text-[#FFF9D0] font-bold text-xl uppercase rounded-full hover:bg-[#FFF9D0] hover:text-brand-navy transition-colors">
            Explore Flavours
          </button>
        </div>

        <div className="w-full max-w-6xl px-6 flex flex-col md:flex-row justify-between items-center border-t border-[#FFF9D0]/20 pt-8 mt-12">
          <div className="font-black text-4xl tracking-tighter mb-6 md:mb-0">FIZZY</div>
          <div className="flex space-x-8 font-bold uppercase text-sm">
            <a href="#story" className="hover:text-brand-cyan transition-colors">Story</a>
            <a href="#flavours" className="hover:text-brand-cyan transition-colors">Flavours</a>
            <a href="#benefits" className="hover:text-brand-cyan transition-colors">Benefits</a>
            <a href="#shop" className="hover:text-brand-cyan transition-colors">Shop</a>
          </div>
          <div className="mt-6 md:mt-0 text-sm font-medium opacity-60">
            © 2026 Fizzy Craft Soda.
          </div>
        </div>
      </footer>
    </main>
  );
}
