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
    // if (isHome) return;

    const onScroll = () => {
      setScrolled(window.scrollY > 40);
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  return (
    <header
      className={`
        z-50 transition-all duration-300
        ${
          scrolled 
            ? "fixed top-4 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-md shadow-lg rounded-full px-6"
            : "relative w-full bg-[#fdfcfa] border-b border-black/5"
        }
      `}
    >
      <div
        className={`
          flex items-center justify-between
          transition-all duration-300
          ${
            scrolled && !isHome
              ? "h-14 gap-8"
              : "max-w-7xl mx-auto px-6 h-20 gap-8"
          }
        `}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0">
          <Image
            src="/crypto.png"
            alt="CryptoAid logo"
            className="h-10 w-auto"
            width={300}
            height={300}
            priority
          />
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-10 text-sm text-[#3b3b3b]">
          <a href="/campaigns" className="hover:opacity-70 transition">
            Campaigns
          </a>
          <Link href="/howItWorks" className="hover:opacity-70 transition">
            How it works
          </Link>
          <a href="/about" className="hover:opacity-70 transition">
            About
          </a>
        </nav>

        {/* Connect Wallet */}
        <div className="shrink-0">
          <button
            className={`
              px-5 py-2 rounded-full text-sm font-semibold transition
              ${
                scrolled && !isHome
                  ? "bg-neutral-700/60 text-white border border-white/10 hover:bg-neutral-700/80"
                  : "bg-[#4f7cff] text-white hover:opacity-90"
              }
            `}
          >
            Connect Wallet
          </button>
        </div>
      </div>
    </header>
  );
}
