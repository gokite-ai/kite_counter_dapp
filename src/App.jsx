import { useState } from "react";
import { ethers } from "ethers";

import Header from "./components/Header";
import Footer from "./components/Footer";
import CONTRACT_ABI from "../abis/Counter.json";
import "./index.css";

const CONTRACT_ADDRESS = "0x67924334CAC5f87ce009FF0568E01930a74A1aEA";
const KITE_TESTNET_CHAIN_ID = 2368;
const KITESCAN_EXPLORER_URL = "https://testnet.kitescan.ai";

function App() {
  const [count, setCount] = useState(null);
  const [, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [error, setError] = useState("");
  const [lastTxHash, setLastTxHash] = useState(null);
  const [copied, setCopied] = useState(false);

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError("Please install MetaMask!");
      return;
    }

    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const { chainId } = await provider.getNetwork();

      if (parseInt(chainId) !== KITE_TESTNET_CHAIN_ID) {
        setError("Wrong network! Please switch to Kite Testnet.");
        return;
      }

      setProvider(provider);
      setWallet(await signer.getAddress());

      const contractInstance = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );
      setContract(contractInstance);

      const currentCount = await contractInstance.getCount();
      setCount(currentCount.toString());
      setError("");
    }
  };

  const copyTxHash = async () => {
    if (!lastTxHash) return;
    try {
      await navigator.clipboard.writeText(lastTxHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API is blocked
    }
  };

  const increment = async () => {
    if (!contract) return;
    try {
      const tx = await contract.increment();
      setLastTxHash(tx.hash);
      await tx.wait();
      const updatedCount = await contract.getCount();
      setCount(updatedCount.toString());
    } catch (err) {
      setError(err?.shortMessage || err?.message || "Transaction failed");
    }
  };

  const decrement = async () => {
    if (!contract) return;
    try {
      const tx = await contract.decrement();
      setLastTxHash(tx.hash);
      await tx.wait();
      const updatedCount = await contract.getCount();
      setCount(updatedCount.toString());
    } catch (err) {
      setError(err?.shortMessage || err?.message || "Transaction failed");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between mainbg">
      <Header wallet={wallet} />
      <div className="flex flex-col items-center p-6 flex-1 w-full">
        {error && <p className="text-red-500 mb-4">{error}</p>}

        {!wallet ? (
          <button
            onClick={connectWallet}
            className="btn-secondary cursor-pointer mt-24"
          >
            Connect Wallet
          </button>
        ) : (
          <div className="bg-white shadow-lg rounded-lg  w-80 text-center mt-32">
            <h2 className="text-2xl font-bold mb-0 border-gray-100 border-b pb-3 pt-3">
              Counter
            </h2>
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
            {lastTxHash && (
              <div className="border-t border-gray-100 p-3 bg-gray-50 rounded-b-lg text-xs text-gray-600 flex items-center justify-between">
                <div>
                  <span className="text-gray-500">Tx: </span>
                  <a
                    href={`${KITESCAN_EXPLORER_URL}/tx/${lastTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-mono"
                  >
                    {lastTxHash.slice(0, 6)}...{lastTxHash.slice(-4)}
                  </a>
                </div>
                <button
                  onClick={copyTxHash}
                  className="text-gray-500 hover:text-gray-800 text-[11px] px-2 py-0.5 rounded border border-gray-200 bg-white cursor-pointer"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default App;
