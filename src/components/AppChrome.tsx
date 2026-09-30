"use client";

import { usePathname } from "next/navigation";

import Header from "@/components/Header";
import ViewCanvas from "@/components/ViewCanvas";

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStandalonePage = pathname === "/login" || pathname === "/shop";

  return (
    <>
      {!isStandalonePage && <Header />}
      <main>{children}{!isStandalonePage && <ViewCanvas />}</main>
    </>
  );
}
