"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCryptoAid } from "@/context/cryptoAidProvider";
import ConfirmModal, { WalletIcon } from "./Confirmmodal";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

  const { account, connectWallet, disconnectWallet, isConnecting } =
    useCryptoAid();

  const [menuOpen, setMenuOpen] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Scroll behavior
  useEffect(() => {
    if (isHome) return;

    const onScroll = () => {
      setScrolled(window.scrollY > 40);
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Close dropdown if wallet disconnects
  useEffect(() => {
    if (!account) {
      setMenuOpen(false);
    }
  }, [account]);

  const handleConnectClick = () => {
    setShowConnectModal(true);
  };

  const handleConfirmConnect = async () => {
    setShowConnectModal(false);
    await connectWallet();
  };

  return (
    <>
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

          {/* Wallet */}
          <div className="shrink-0">
            {account ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((s) => !s)}
                  className="px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 bg-violet-100 text-violet-700 border border-violet-200 hover:bg-violet-200 cursor-pointer"
                >
                  {account.slice(0, 6)}...{account.slice(-4)}
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-xl p-2 shadow-lg z-50">
                    <button
                      onClick={() => {
                        disconnectWallet();
                        setMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition text-sm cursor-pointer"
                    >
                      Disconnect Wallet
                    </button>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(account);
                        setMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition text-sm mt-1 cursor-pointer"
                    >
                      Copy Address
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleConnectClick}
                disabled={isConnecting}
                className="px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 bg-violet-100 text-violet-700 border border-violet-200 hover:bg-violet-200 cursor-pointer disabled:opacity-50"
              >
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Connect Wallet Modal */}
      <ConfirmModal
        isOpen={showConnectModal}
        title="Connect Wallet"
        onCancel={() => setShowConnectModal(false)}
        onConfirm={handleConfirmConnect}
        confirmText={isConnecting ? "Connecting..." : "Connect"}
        disabled={isConnecting}
        icon={<WalletIcon />}
      >
        <p className="text-[#6b6b6b] mb-6 leading-relaxed">
          CryptoAid would like to connect to your wallet. This will allow you to
          create campaigns, donate, and interact with the blockchain.
        </p>

        <div className="bg-[#faf8f6] border border-[#e0e0e0] rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-sm text-[#3b3b3b] mb-2">
            This connection will allow:
          </h4>
          <ul className="text-xs text-[#6b6b6b] space-y-1">
            <li>• View your wallet address</li>
            <li>• Request transaction approvals</li>
            <li>• Interact with smart contracts</li>
          </ul>
        </div>

        <p className="text-xs text-[#9b9b9b]">
          Your wallet will remain secure. CryptoAid cannot access your funds
          without your explicit approval for each transaction.
        </p>
      </ConfirmModal>
    </>
  );
}