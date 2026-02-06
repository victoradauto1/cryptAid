import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-8">
        
        {/* Logo / Home anchor */}
        <Link
          href="/"
          className="h-full flex items-center shrink-0"
        >
          <Image
            src="/crypto.png"
            alt="CryptoAid logo"
            className="h-[70%] w-auto"
            width={300}
            height={300}
            priority
          />
        </Link>

        {/* Navigation (desktop / tablet only) */}
        <nav className="hidden md:flex flex-1 justify-center gap-10 text-sm text-[#3b3b3b]">
          <a href="#campaigns" className="hover:opacity-70 transition">
            Campaigns
          </a>
          <a href="#how-it-works" className="hover:opacity-70 transition">
            How it works
          </a>
          <a href="#about" className="hover:opacity-70 transition">
            About
          </a>
        </nav>

        {/* Connect Wallet */}
        <div className="shrink-0">
          <button className="px-5 py-2 rounded-full bg-[#7b3f3f] text-white text-sm hover:opacity-90 transition">
            Connect Wallet
          </button>
        </div>

      </div>
    </header>
  );
}
