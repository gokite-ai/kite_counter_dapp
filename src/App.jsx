import { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";

import Header from "./components/Header";
import Footer from "./components/Footer";
import ActivityFeed from "./components/ActivityFeed";
import StepSelector from "./components/StepSelector";
import CONTRACT_ABI from "../abis/Counter.json";
import "./index.css";
import { playCounterClick } from "./utils/audioFeedback";
import { createRevisionGuard, selectKiteNetwork } from "./wallet-session";
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
  const [contract, setContract] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [error, setError] = useState("");
  const [pendingAction, setPendingAction] = useState(null);
  const [stepMultiplier, setStepMultiplier] = useState(1);
  const [activities, setActivities] = useState([]);
  const [lastTxHash, setLastTxHash] = useState(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const sessionGuard = useRef(null);
  if (!sessionGuard.current) sessionGuard.current = createRevisionGuard();
  const countGuard = useRef(null);
  if (!countGuard.current) countGuard.current = createRevisionGuard();
  const connectionAttempt = useRef(0);
  const switchingByApp = useRef(false);
  const [copiedHash, setCopiedHash] = useState(null);
  const sessionValid = (revision) => sessionGuard.current.isCurrent(revision);

  const resetSession = () => {
    sessionGuard.current.invalidate();
    countGuard.current.invalidate();
    connectionAttempt.current += 1;
    setWallet(null);
    setContract(null);
    setCount(null);
    setLastTxHash(null);
    setCopiedHash(null);
    setActivities([]);
    setError("");
    setPendingAction(null);
    setIsSyncing(false);
  };

  const disconnectWallet = () => resetSession();

  const switchOrAddKiteNetwork = async () => {
    if (!window.ethereum) {
      setError("Please install a compatible wallet.");
      return false;
    }
    setIsSwitching(true);
    switchingByApp.current = true;
    try {
      await selectKiteNetwork(window.ethereum, KITE_TESTNET_PARAMS);
      return true;
    } catch (err) {
      setError(err?.message || "Could not switch to Kite AI Testnet.");
      return false;
    } finally {
      switchingByApp.current = false;
      setIsSwitching(false);
    }
  };

  const recordActivity = (type, hash) => {
    setLastTxHash(hash);
    setCopiedHash(null);
    setActivities((previous) => [
      { type, hash, timestamp: new Date().toLocaleTimeString() },
      ...previous,
    ].slice(0, 10));
  };

  const syncCountNow = async () => {
    if (!contract || isSyncing || pendingAction) return;
    const session = sessionGuard.current.capture();
    const read = countGuard.current.invalidate();
    setIsSyncing(true);
    try {
      const updated = await contract.getCount();
      if (sessionValid(session) && countGuard.current.isCurrent(read)) {
        setCount(updated.toString());
        setError("");
      }
    } catch (err) {
      if (sessionValid(session) && countGuard.current.isCurrent(read)) {
        setError(err?.shortMessage || err?.message || "Unable to sync counter.");
      }
    } finally {
      if (sessionValid(session) && countGuard.current.isCurrent(read)) setIsSyncing(false);
    }
  };

  const copyTxHash = async () => {
    if (!lastTxHash) return;
    const hash = lastTxHash;
    const session = sessionGuard.current.capture();
    try {
      await navigator.clipboard.writeText(hash);
      if (sessionValid(session)) setCopiedHash(hash);
    } catch {
      if (sessionValid(session)) setError("Unable to copy transaction hash.");
    }
  };

  useEffect(() => {
    const ethereum = window.ethereum;
    if (!ethereum?.on) return;
    const onAccountChange = () => resetSession();
    const onChainChange = () => {
      // Even an intentional network switch invalidates existing session data.
      // The in-progress connection is allowed to re-check the selected chain.
      const attempt = connectionAttempt.current;
      resetSession();
      if (switchingByApp.current) connectionAttempt.current = attempt;
    };
    ethereum.on("accountsChanged", onAccountChange);
    ethereum.on("chainChanged", onChainChange);
    return () => {
      ethereum.removeListener?.("accountsChanged", onAccountChange);
      ethereum.removeListener?.("chainChanged", onChainChange);
    };
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError("Please install MetaMask!");
      return;
    }
    const attempt = ++connectionAttempt.current;
    const currentAttempt = () => connectionAttempt.current === attempt;
    try {
      let provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      if (!currentAttempt()) return;
      if (Number(network.chainId) !== KITE_TESTNET_CHAIN_ID) {
        const switched = await switchOrAddKiteNetwork();
        if (!currentAttempt() || !switched) return;
      }
      provider = new ethers.BrowserProvider(window.ethereum);
      const verifiedNetwork = await provider.getNetwork();
      if (!currentAttempt()) return;
      if (Number(verifiedNetwork.chainId) !== KITE_TESTNET_CHAIN_ID) {
        throw new Error("Kite AI Testnet was not selected.");
      }
      const signer = await provider.getSigner();
      if (!currentAttempt()) return;
      const address = await signer.getAddress();
      if (!currentAttempt()) return;
      const instance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const initialCount = await instance.getCount();
      if (!currentAttempt()) return;
      // Verify the wallet did not change accounts or networks during initialization.
      const activeChain = await window.ethereum.request({ method: "eth_chainId" });
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      if (!currentAttempt() || Number(activeChain) !== KITE_TESTNET_CHAIN_ID ||
          !accounts.some((account) => account.toLowerCase() === address.toLowerCase())) return;
      sessionGuard.current.invalidate();
      countGuard.current.invalidate();
      setContract(instance);
      setCount(initialCount.toString());
      setWallet(address);
      setError("");
    } catch (err) {
      if (currentAttempt()) setError(err?.message || "Failed to connect wallet.");
    }
  };

  const performAction = async (action) => {
    if (!contract || pendingAction) return;
    const session = sessionGuard.current.capture();
    countGuard.current.invalidate(); // Ignore any already-started Sync.
    setPendingAction(action);
    setIsSyncing(false);
    setError("");
    try {
      const tx = await contract[action]();
      if (!sessionValid(session)) return;
      const receipt = await tx.wait();
      if (!sessionValid(session)) return;
      if (!receipt || receipt.status !== 1) throw new Error("Transaction failed on-chain.");
      const updated = await contract.getCount();
      if (!sessionValid(session)) return;
      recordActivity(action === "increment" ? "Increment" : "Decrement", tx.hash);
      setCount(updated.toString());
      playCounterClick(1046.5, 0.25);
    } catch (err) {
      if (sessionValid(session)) setError(err?.shortMessage || err?.message || "Transaction failed.");
    } finally {
      if (sessionValid(session)) setPendingAction(null);
    }
  };
  const increment = () => performAction("increment");
  const decrement = () => performAction("decrement");

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
                disabled={isSyncing || isPending || !contract}
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
                  {copiedHash === lastTxHash ? "Copied!" : "Copy"}
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
