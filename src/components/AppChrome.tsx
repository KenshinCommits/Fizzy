"use client";

import { usePathname } from "next/navigation";

import Header from "@/components/Header";
import ViewCanvas from "@/components/ViewCanvas";

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  return (
    <>
      {!isLogin && <Header />}
      <main>{children}{!isLogin && <ViewCanvas />}</main>
    </>
  );
}
