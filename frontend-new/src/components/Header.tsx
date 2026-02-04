import Image from "next/image";

export default function Header() {
  return (
    <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
      
      {/* Title + Logo */}
      <div className="flex items-center gap-3">
        <span className="text-xl font-semibold">CryptoAid</span>
        <Image
          src="/cryptAidIcon.png"
          alt="CryptoAid logo"
          width={32}
          height={32}
          priority
        />
      </div>

      {/* Navigation */}
      <nav className="flex gap-6 text-sm text-[#3b3b3b]">
        <a href="#campaigns" className="hover:opacity-70">
          Campaigns
        </a>
        <a href="#how-it-works" className="hover:opacity-70">
          How it works
        </a>
        <a href="#about" className="hover:opacity-70">
          About
        </a>
      </nav>

      {/* Connect Wallet */}
      <button
        className="px-5 py-2 rounded-full bg-[#7b3f3f] text-white text-sm hover:opacity-90 transition"
      >
        Connect Wallet
      </button>
    </header>
  );
}
