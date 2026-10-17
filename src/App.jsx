import { useState } from "react";
import { ethers } from "ethers";

import Header from "./components/Header";
import Footer from "./components/Footer";
import ActivityFeed from "./components/ActivityFeed";
import CONTRACT_ABI from "../abis/Counter.json";
import "./index.css";

const CONTRACT_ADDRESS = "0x67924334CAC5f87ce009FF0568E01930a74A1aEA";
const KITE_TESTNET_CHAIN_ID = 2368;

function App() {
  const [count, setCount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [error, setError] = useState("");
  const [activities, setActivities] = useState([]);

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

  const increment = async () => {
    if (!contract) return;
    try {
      const tx = await contract.increment();
      await tx.wait();
      const updatedCount = await contract.getCount();
      setCount(updatedCount.toString());
      setActivities((prev) => [
        {
          type: "Increment",
          hash: tx.hash,
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 9),
      ]);
      setError("");
    } catch (err) {
      setError(err?.shortMessage || err?.message || "Increment failed.");
    }
  };

  const decrement = async () => {
    if (!contract) return;
    try {
      const tx = await contract.decrement();
      await tx.wait();
      const updatedCount = await contract.getCount();
      setCount(updatedCount.toString());
      setActivities((prev) => [
        {
          type: "Decrement",
          hash: tx.hash,
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 9),
      ]);
      setError("");
    } catch (err) {
      setError(err?.shortMessage || err?.message || "Decrement failed.");
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
          <div className="flex flex-col items-center mt-20">
            <div className="bg-white shadow-lg rounded-lg w-80 text-center">
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

            <ActivityFeed activities={activities} />
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default App;
