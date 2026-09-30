'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function InteractiveWatermelon() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePos({
          x: e.clientX - rect.left - rect.width / 2,
          y: e.clientY - rect.top - rect.height / 2,
        });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-[60vh] flex items-center justify-center overflow-hidden cursor-crosshair z-20 pointer-events-auto group bg-brand-cyan/20 mt-24"
    >
      <div className="absolute top-10 text-brand-navy font-bold tracking-widest uppercase text-sm opacity-50">
        Hover to slice
      </div>
      
      {/* Central Watermelon Container */}
      <motion.div 
        className="relative w-64 h-64 flex items-center justify-center"
        animate={{ 
          rotate: mousePos.x * 0.05,
          scale: 1 + Math.abs(mousePos.y) * 0.001
        }}
      >
        {/* Top Slice */}
        <motion.div
          className="absolute w-full h-1/2 top-0 bg-brand-red rounded-t-full border-t-[16px] border-x-[16px] border-brand-green flex items-end justify-center pb-4"
          animate={{
            y: mousePos.y < 0 ? mousePos.y * 0.2 : 0,
            x: mousePos.x * 0.1,
            rotate: mousePos.x * 0.02
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
           <div className="flex space-x-4">
             <div className="w-2 h-3 bg-brand-navy rounded-full rounded-t-none"></div>
             <div className="w-2 h-3 bg-brand-navy rounded-full rounded-t-none"></div>
             <div className="w-2 h-3 bg-brand-navy rounded-full rounded-t-none"></div>
           </div>
        </motion.div>

        {/* Bottom Slice */}
        <motion.div
          className="absolute w-full h-1/2 bottom-0 bg-brand-red rounded-b-full border-b-[16px] border-x-[16px] border-brand-green flex items-start justify-center pt-4"
          animate={{
            y: mousePos.y > 0 ? mousePos.y * 0.2 : 0,
            x: mousePos.x * -0.1,
            rotate: mousePos.x * -0.02
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
           <div className="flex space-x-4">
             <div className="w-2 h-3 bg-brand-navy rounded-full rounded-b-none"></div>
             <div className="w-2 h-3 bg-brand-navy rounded-full rounded-b-none"></div>
             <div className="w-2 h-3 bg-brand-navy rounded-full rounded-b-none"></div>
           </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
