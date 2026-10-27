import React, { useState } from "react";
import logo from "../assets/network_logo.svg";

export default function Header({ wallet, disconnectWallet }) {
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    if (!wallet) return;
    try {
      await navigator.clipboard.writeText(wallet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <header className="headerwrap w-full bg-white text-white py-4 px-6 flex flex-wrap justify-between items-center border-gray-200 border-b">
      <h1 className="logowrap"><img src={logo} alt="Kite Logo" />Counter Dapp</h1>

      <div className="flex items-center space-x-3">
        {wallet && (
          <div className="flex items-center gap-2">
            <button
              onClick={copyAddress}
              title="Click to copy full address"
              className="text-[#0077FF] font-medium border border-[#A9D1FF] rounded-md transition-all duration-300 flex items-center justify-center bg-gradient-to-t from-[#E1EFFF] to-[#EFF6FF] hover:bg-blue-50 text-sm py-2 px-4 cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 inline-block"></span>
              <span>{copied ? "Copied!" : `${wallet.slice(0, 6)}...${wallet.slice(-4)}`}</span>
            </button>

            {disconnectWallet && (
              <button
                onClick={disconnectWallet}
                className="text-gray-500 hover:text-red-500 font-medium border border-gray-200 hover:border-red-200 rounded-md transition-all duration-200 text-sm py-2 px-3 cursor-pointer bg-white"
              >
                Disconnect
              </button>
            )}
          </div>
        )}

        <a
          href="https://github.com/gokite-ai/kite_counter_dapp"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#0077FF] font-medium border border-[#A9D1FF] rounded-md transition-all duration-300 flex items-center justify-center bg-gradient-to-t from-[#E1EFFF] to-[#EFF6FF] hover:from-[#0077FF] hover:to-[#0077FF] hover:text-white text-sm py-2 px-4 cursor-pointer"
        >
          GitHub Repo
        </a>
      </div>
    </header>
  );
}
