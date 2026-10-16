import { useState } from "react";
import { ethers } from "ethers";

import Header from "./components/Header";
import Footer from "./components/Footer";
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

      const contractInstance = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );
      setContract(contractInstance);

      const currentCount = await contractInstance.getCount();
      setCount(currentCount.toString());
      setError("");
    } catch (err) {
      setError(err?.message || "Failed to connect wallet.");
    }
  };

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
      <Header wallet={wallet} />
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
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default App;
