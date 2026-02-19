"use client";

import { useEffect, useState } from "react";
import PageTitle from "@/components/PageTitle";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const fullText = "Decentralized online crowdfunding platform ";
  const [animatedText, setAnimatedText] = useState("");
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    let index = 0;

    const interval = setInterval(() => {
      if (index < fullText.length) {
        setAnimatedText(fullText.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);

        setTimeout(() => {
          setShowCursor(false);
        }, 50);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [fullText]);

  return (
    <main className="min-h-screen bg-[#faf8f6] text-[#3b3b3b]">
      {/* Hero */}
      <section className="py-8">
        <div
          className="
            max-w-7xl 
            mx-auto 
            px-6 
            grid 
            grid-cols-1 
            md:grid-cols-2 
            gap-6 
            items-center
          "
        >
          {/* Left */}
          <div className="md:pl-12 lg:pl-16">
            <PageTitle className="text-6xl md:text-7xl lg:text-8xl text-[#3b3b3b] leading-none">
              CryptoAid
            </PageTitle>

            <p className="text-center text-[#6b6b6b] mt-3 min-h-[1.5em]">
              {animatedText}
              {showCursor && <span className="animate-pulse">|</span>}
            </p>
          </div>

          {/* Right */}
          <div className="flex justify-center items-center">
            <div className="overflow-hidden rounded-3xl shadow-lg max-w-sm">
              <Image
                src="/selfhug.png"
                alt="Support and care"
                width={600}
                height={700}
                className="object-cover w-full h-full"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Actions */}
      <section className="py-6 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-6 justify-center items-center max-w-2xl mx-auto">
            
            {/* Primary Action - DONATE */}
            <Link
              href="/campaigns"
              className="
                bg-emerald-500
                text-white
                rounded-full
                px-8
                py-4
                text-lg
                font-semibold
                shadow-md
                hover:bg-emerald-600
                hover:shadow-lg
                transition-all
                duration-300
                w-full
                md:w-auto
                md:flex-1
                text-center
              "
            >
              Donate
            </Link>

            {/* Secondary Action - CREATE CAMPAIGN */}
            <Link
              href="/create"
              className="
                bg-[#4f7cff]
                text-white
                rounded-full
                px-8
                py-4
                text-lg
                font-semibold
                shadow-md
                hover:bg-[#3f6ae0]
                hover:shadow-lg
                transition-all
                duration-300
                w-full
                md:w-auto
                md:flex-1
                text-center
              "
            >
              Create Campaign
            </Link>

          </div>
        </div>
      </section>
    </main>
  );
}
