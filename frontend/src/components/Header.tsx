"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

  useEffect(() => {
    if (isHome) return; // Home não precisa escutar scroll

    const onScroll = () => {
      setScrolled(window.scrollY > 40);
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  return (
    <>
      {/* Spacer apenas quando header for fixed */}
      {isHome && <div className="h-20 w-full" />}

      <header
        className={`
          z-50 transition-all duration-300
          ${
            isHome
              ? "fixed top-0 left-0 w-full bg-white/90 backdrop-blur-md border-b border-black/5"
              : scrolled
              ? "fixed top-4 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-md shadow-lg rounded-full px-6"
              : "relative w-full bg-[#fdfcfa] border-b border-black/5"
          }
        `}
      >
        <div
          className={`
            flex items-center justify-between gap-8
            transition-all duration-300
            ${
              isHome
                ? "max-w-7xl mx-auto px-6 h-20"
                : scrolled
                ? "h-14"
                : "max-w-7xl mx-auto px-6 h-20"
            }
          `}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <Image
              src="/logo.png"
              alt="CryptoAid logo"
              className="h-10 w-auto"
              width={300}
              height={300}
              priority
            />
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-10 text-sm text-[#3b3b3b]">
            <Link href="/campaigns" className="hover:opacity-70 transition">
              Campaigns
            </Link>
            <Link href="/howItWorks" className="hover:opacity-70 transition">
              How it works
            </Link>
            <Link href="/about" className="hover:opacity-70 transition">
              About
            </Link>
          </nav>

          {/* Connect Wallet */}
          {/* Connect Wallet */}
<div className="shrink-0">
  <button
    className={`
      px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300
      ${
        !isHome && scrolled
          ? "bg-violet-100 text-violet-700 border border-violet-200 hover:bg-violet-200"
          : "bg-violet-100 text-violet-700 border border-violet-200 hover:bg-violet-200"
      }
    `}
  >
    Connect Wallet
  </button>
</div>

        </div>
      </header>
    </>
  );
}
