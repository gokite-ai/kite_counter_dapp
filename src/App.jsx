import { useState, useEffect } from "react";
import { ethers } from "ethers";

import Header from "./components/Header";
import Footer from "./components/Footer";
import ActivityFeed from "./components/ActivityFeed";
import StepSelector from "./components/StepSelector";
import CONTRACT_ABI from "../abis/Counter.json";
import "./index.css";
import { KITE_TESTNET_CHAIN_ID, KITESCAN_EXPLORER_URL, KITE_TESTNET_PARAMS } from "./kite-network";

const CONTRACT_ADDRESS = "0x67924334CAC5f87ce009FF0568E01930a74A1aEA";

function App() {
  const [discoveredWallets, setDiscoveredWallets] = useState([]);

  useEffect(() => {
    const handleAnnouncement = (event) => {
      if (!event.detail) return;
      setDiscoveredWallets((prev) => {
        if (prev.some((w) => w.info.uuid === event.detail.info.uuid)) return prev;
        return [...prev, event.detail];
      });
    };
    window.addEventListener("eip6963:announceProvider", handleAnnouncement);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    return () => window.removeEventListener("eip6963:announceProvider", handleAnnouncement);
  }, []);
  const [count, setCount] = useState(null);
  const [, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [error, setError] = useState("");
  const [pendingAction, setPendingAction] = useState(null);
  const [stepMultiplier, setStepMultiplier] = useState(1); // 'increment' | 'decrement' | null

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError("Please install MetaMask!");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      let signer = await provider.getSigner();
      const network = await provider.getNetwork();

      if (Number(network.chainId) !== KITE_TESTNET_CHAIN_ID) {
        const switched = await switchOrAddKiteNetwork();
        if (!switched) return;
      }

      // Re-instantiate provider after network switch to ensure active chain
      const updatedProvider = new ethers.BrowserProvider(window.ethereum);
      signer = await updatedProvider.getSigner();

      setProvider(updatedProvider);
      setWallet(await signer.getAddress());
      await initializeContract(signer);
      setError("");
    } catch (err) {
      setError(err?.message || "Failed to connect wallet.");
    }
  };

  const increment = async () => {
    if (!contract || pendingAction) return;
    setPendingAction("increment");
    setError("");
    try {
      const tx = await contract.increment();
      await tx.wait();
      recordActivity("Increment", tx.hash);
      const updatedCount = await contract.getCount();
      setCount(updatedCount.toString());
      playChime(1046.5, 0.25);
    } catch (err) {
      setError(err?.shortMessage || err?.message || "Increment transaction failed.");
    } finally {
      setPendingAction(null);
    }
  };

  const decrement = async () => {
    if (!contract || pendingAction) return;
    setPendingAction("decrement");
    setError("");
    try {
      const tx = await contract.decrement();
      await tx.wait();
      recordActivity("Decrement", tx.hash);
      const updatedCount = await contract.getCount();
      setCount(updatedCount.toString());
      playChime(1046.5, 0.25);
    } catch (err) {
      setError(err?.shortMessage || err?.message || "Decrement transaction failed.");
    } finally {
      setPendingAction(null);
    }
  };

  const isPending = pendingAction !== null;

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
          <div className="flex flex-col items-center gap-2 mt-24">
            {discoveredWallets.length > 0 && (
              <div className="text-xs text-gray-400 mb-1 flex items-center gap-1.5">
                <span>EIP-6963 Wallets detected:</span>
                {discoveredWallets.map((w) => (
                  <span key={w.info.uuid} className="font-semibold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">
                    {w.info.name}
                  </span>
                ))}
              </div>
            )}
            <button
            onClick={connectWallet}
            className="btn-secondary cursor-pointer mt-24"
          >
            Connect Wallet
          </button>
          </div>
        ) : (
          <>
          <div className="bg-white shadow-lg rounded-lg  w-80 text-center mt-32">
            <div className="flex items-center justify-between border-gray-100 border-b px-5 py-3">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">Counter</h2>
                <span className="flex h-2 w-2 relative" title="Live Polling Active">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <button
                type="button"
                onClick={syncCountNow}
                disabled={isSyncing}
                className="text-xs text-gray-500 hover:text-indigo-600 flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {isSyncing ? "Syncing..." : "Sync"}
              </button>
            </div>
            <p className="text-7xl font-bold text-gray-800 mb-0 pb-10 pt-10 mb-5 mt-5">
              {count !== null ? count : "Loading..."}
            </p>
            <div className="px-4 pt-3 pb-1"><StepSelector step={stepMultiplier} onSelectStep={setStepMultiplier} disabled={isPending} /></div>
            <div className="flex justify-between gap-3 border-gray-100 border-t p-4">
              <button
                onClick={increment}
                disabled={isPending}
                className="btn-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pendingAction === "increment" ? "Incrementing..." : "Increment"}
              </button>
              <button
                onClick={decrement}
                disabled={isPending}
                className="btn-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pendingAction === "decrement" ? "Decrementing..." : "Decrement"}
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
            <ActivityFeed activities={activities} />
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default App;
