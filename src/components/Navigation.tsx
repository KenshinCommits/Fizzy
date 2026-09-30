'use client';

import React from 'react';
import { ShoppingBag, Menu } from 'lucide-react';
import Link from 'next/link';

export default function Navigation() {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 px-6 py-6 flex justify-between items-center mix-blend-difference text-white">
      <div className="text-3xl font-black tracking-tighter mix-blend-difference">
        <Link href="/">FIZZY</Link>
      </div>

      <div className="hidden md:flex items-center space-x-12 font-bold text-sm uppercase tracking-widest">
        <Link href="#story" className="hover:text-brand-cyan transition-colors">Story</Link>
        <Link href="#flavours" className="hover:text-brand-cyan transition-colors">Flavours</Link>
        <Link href="#benefits" className="hover:text-brand-cyan transition-colors">Benefits</Link>
        <Link href="#shop" className="hover:text-brand-cyan transition-colors">Shop</Link>
      </div>

      <div className="flex items-center space-x-6">
        <button className="hover:scale-110 transition-transform">
          <ShoppingBag size={24} />
        </button>
        <button className="md:hidden hover:scale-110 transition-transform">
          <Menu size={24} />
        </button>
      </div>
    </nav>
  );
}
