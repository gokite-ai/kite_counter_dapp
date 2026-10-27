import { useState, useEffect } from "react";
import { ethers } from "ethers";

import Header from "./components/Header";
import Footer from "./components/Footer";
import ActivityFeed from "./components/ActivityFeed";
import CONTRACT_ABI from "../abis/Counter.json";
import "./index.css";

const CONTRACT_ADDRESS = "0x67924334CAC5f87ce009FF0568E01930a74A1aEA";
const KITE_TESTNET_CHAIN_ID = 2368;

const KITE_TESTNET_PARAMS = {
  chainId: "0x940", // 2368 in hex
  chainName: "Kite AI Testnet",
  nativeCurrency: {
    name: "KITE",
    symbol: "KITE",
    decimals: 18,
  },
  rpcUrls: ["https://rpc-testnet.kitescan.ai"],
  blockExplorerUrls: ["https://testnet.kitescan.ai"],
};

function App() {
  const [count, setCount] = useState(null);
  const [, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [error, setError] = useState("");
  const [isSwitching, setIsSwitching] = useState(false);

  const switchOrAddKiteNetwork = async () => {
    if (!window.ethereum) {
      setError("Please install MetaMask!");
      return false;
    }

    setIsSwitching(true);
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: KITE_TESTNET_PARAMS.chainId }],
      });
      setError("");
      return true;
    } catch (switchError) {
      // Error code 4902 indicates that the chain has not been added to MetaMask.
      if (
        switchError.code === 4902 ||
        switchError?.data?.originalError?.code === 4902
      ) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [KITE_TESTNET_PARAMS],
          });
          setError("");
          return true;
        } catch (addError) {
          setError(addError?.message || "Failed to add Kite Testnet to your wallet.");
          return false;
        }
      }
      setError("Please switch your wallet to Kite AI Testnet (Chain ID 2368).");
      return false;
    } finally {
      setIsSwitching(false);
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError("Please install MetaMask!");
      return;
    }

    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const network = await browserProvider.getNetwork();

      if (Number(network.chainId) !== KITE_TESTNET_CHAIN_ID) {
        const switched = await switchOrAddKiteNetwork();
        if (!switched) return;
      }

      // Re-instantiate provider after network switch to ensure active chain
      const updatedProvider = new ethers.BrowserProvider(window.ethereum);
      const signer = await updatedProvider.getSigner();

      setProvider(updatedProvider);
      setWallet(await signer.getAddress());
      await initializeContract(signer);
      setError("");
    } catch (err) {
      setError(err?.message || "Failed to connect wallet.");
    }
  };

  // Listen to account and chain changes with cleanup
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts) => {
      if (accounts.length === 0) {
        setWallet(null);
        setContract(null);
        setCount(null);
      } else if (accounts[0] !== wallet) {
        setWallet(accounts[0]);
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        await initializeContract(signer);
      }
    };

    const handleChainChanged = (chainIdHex) => {
      const currentChainId = parseInt(chainIdHex, 16);
      if (currentChainId !== KITE_TESTNET_CHAIN_ID) {
        setError("Network changed! Please switch back to Kite Testnet (Chain ID 2368).");
        setContract(null);
      } else {
        setError("");
        if (wallet) {
          connectWallet();
        }
      }
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener?.("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [wallet]);

  const increment = async () => {
    if (!contract) return;
    try {
      const tx = await contract.increment();
      await tx.wait();
      const updatedCount = await contract.getCount();
      setCount(updatedCount.toString());
    } catch (err) {
      setError(err?.shortMessage || err?.message || "Transaction failed.");
    }
  };

  const decrement = async () => {
    if (!contract) return;
    try {
      const tx = await contract.decrement();
      await tx.wait();
      const updatedCount = await contract.getCount();
      setCount(updatedCount.toString());
    } catch (err) {
      setError(err?.shortMessage || err?.message || "Transaction failed.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between mainbg">
      <Header wallet={wallet} disconnectWallet={disconnectWallet} />
      <div className="flex flex-col items-center p-6 flex-1 w-full">
        {error && (
          <div className="flex flex-col items-center gap-2 mb-4">
            <p className="text-red-500">{error}</p>
            {error.includes("Kite AI Testnet") && (
              <button
                onClick={switchOrAddKiteNetwork}
                disabled={isSwitching}
                className="btn-secondary text-xs px-3 py-1 cursor-pointer"
              >
                {isSwitching ? "Switching..." : "Switch to Kite Testnet"}
              </button>
            )}
          </div>
        )}

        {!wallet ? (
          <button
            onClick={connectWallet}
            className="btn-secondary cursor-pointer mt-24"
          >
            Connect Wallet
          </button>
        ) : (
          <div className="flex flex-col items-center mt-20">
            <div className="bg-white shadow-lg rounded-lg w-80 text-center">
              <div className="flex items-center justify-between px-4 py-3 border-gray-100 border-b">
                <span className="w-5" />
                <h2 className="text-2xl font-bold">Counter</h2>
                <button
                  onClick={syncCount}
                  disabled={isSyncing}
                  className="text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                  title="Refresh latest count from blockchain"
                >
                  <svg
                    className={`w-4 h-4 ${isSyncing ? "animate-spin text-indigo-600" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
              </div>
              <p className="text-7xl font-bold text-gray-800 mb-0 pb-10 pt-10 mb-5 mt-5">
                {count !== null ? count : "Loading..."}
              </p>
              <div className="flex justify-between gap-3 border-gray-100 border-t p-4">
                <button
                  onClick={increment}
                  className="btn-primary cursor-pointer"
                >
                  Increment
                </button>
                <button
                  onClick={decrement}
                  className="btn-primary cursor-pointer"
                >
                  Decrement
                </button>
              </div>
            </div>

            <ActivityFeed activities={activities} />
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default App;
