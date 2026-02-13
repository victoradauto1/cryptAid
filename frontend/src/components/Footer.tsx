export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-black text-gray-400">
      {/* Upper section */}
      <div className="w-full py-6 flex flex-col items-center">
        <div className="flex items-center gap-8">
          <p className="text-sm">&copy; {currentYear} CryptoAid</p>

          <nav className="flex gap-6">
            <a href="/" className="hover:text-white transition">
              Home
            </a>
            <a href="/about" className="hover:text-white transition">
              About
            </a>
            <a href="/transparency" className="hover:text-white transition">
              Transparency
            </a>
          </nav>
        </div>
      </div>

      {/* Divider line */}
      <div className="w-full h-px bg-white/10"></div>

      {/* Lower section */}
      <div className="w-full py-10 px-6 bg-black/90 border-t border-white/5">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-8">
          {/* Social icons */}
          <div className="flex items-center gap-6">
            <a href="javascript:void(0)" className="hover:text-white transition">
              <svg width="26" height="26" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22 12a10 10 0 1 0-11.5 9.9v-7h-2v-3h2v-2.3c0-2 1.2-3.1 3-3.1.9 0 1.8.1 2 .1v2.3h-1.1c-1 0-1.3.6-1.3 1.2V12h2.5l-.4 3h-2.1v7A10 10 0 0 0 22 12z" />
              </svg>
            </a>

            <a href="javascript:void(0)" className="hover:text-white transition">
              <svg width="26" height="26" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23 3a10.9 10.9 0 0 1-3.1 1.5A4.48 4.48 0 0 0 16.5 3c-2.5 0-4.5 2-4.5 4.4 0 .3 0 .7.1 1A12.9 12.9 0 0 1 3 4s-4 9 5 13a13.4 13.4 0 0 1-8 2c9 5 20 0 20-11.5v-.5A7.7 7.7 0 0 0 23 3z" />
              </svg>
            </a>

            <a href="javascript:void(0)" className="hover:text-white transition">
              <svg width="26" height="26" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 2C4.2 2 2 4.2 2 7v10c0 2.8 2.2 5 5 5h10c2.8 0 5-2.2 5-5V7c0-2.8-2.2-5-5-5H7z" />
              </svg>
            </a>

            <a href="javascript:void(0)" className="hover:text-white transition">
              <svg width="26" height="26" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.45 20.45h-3.6v-5.4c0-1.3 0-3-1.9-3s-2.1 1.5-2.1 2.9v5.4h-3.6V9h3.4v1.6h.1a3.7 3.7 0 0 1 3.3-1.8c3.5 0 4.1 2.3 4.1 5.2v6.4z" />
              </svg>
            </a>
          </div>

          <p className="text-center text-sm leading-relaxed max-w-2xl text-gray-500">
            <strong className="text-gray-300">
              Decentralized donations, on-chain transparency.
            </strong>
            <br />
            CryptoAid is a non-custodial platform. Users are fully responsible for
            their wallet interactions and donation decisions.
          </p>
        </div>
      </div>
    </footer>
  );
}
