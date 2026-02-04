import Header from "@/components/Header";
import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#faf8f6] text-[#3b3b3b]">
      {/* Header */}
      <Header/>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Left */}
        <div>
          <span className="inline-block mb-4 px-4 py-1 rounded-full bg-[#efe7e3] text-sm">
            Crypto donations made simple
          </span>
          <h1 className="text-5xl font-semibold leading-tight mb-6">
            Transparency.<br />
            Trust.<br />
            Real Impact.
          </h1>
          <p className="text-lg mb-8 text-[#6b6b6b] max-w-xl">
            CryptoAid is a decentralized donation platform that ensures funds reach
            the right hands with full transparency, automated rules, and on-chain accountability.
          </p>
          <div className="flex gap-4">
            <button className="px-6 py-3 rounded-full bg-[#7b3f3f] text-white">
              Get Started
            </button>
            <button className="px-6 py-3 rounded-full border border-[#7b3f3f] text-[#7b3f3f]">
              Learn More
            </button>
          </div>
        </div>

        {/* Right */}
        <div className="relative">
          <div className="rounded-4xl overflow-hidden shadow-lg">
            <Image
              src="/selfhugwoman.png"
              alt="Support and care"
              width={600}
              height={700}
              className="object-cover"
            />
          </div>

          {/* Floating pills */}
          <span className="absolute top-10 -left-6 px-4 py-2 rounded-full bg-white shadow text-sm">
            Transparent
          </span>
          <span className="absolute top-1/2 -left-10 px-4 py-2 rounded-full bg-white shadow text-sm">
            Trustless
          </span>
          <span className="absolute bottom-12 -left-2 px-4 py-2 rounded-full bg-white shadow text-sm">
            On-chain
          </span>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-24 grid grid-cols-1 md:grid-cols-3 gap-12">
        <div>
          <h3 className="text-xl font-semibold mb-3">Transparent</h3>
          <p className="text-[#6b6b6b]">
            All donations and campaign rules are fully auditable on-chain.
          </p>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-3">Automated</h3>
          <p className="text-[#6b6b6b]">
            Smart contracts enforce deadlines, goals, and fund distribution.
          </p>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-3">Secure</h3>
          <p className="text-[#6b6b6b]">
            No intermediaries, no custody, no hidden logic.
          </p>
        </div>
      </section>
    </main>
  );
}
