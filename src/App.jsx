import { useCallback, useEffect, useRef, useState } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ActivityFeed from "./components/ActivityFeed";
import { createCounterReader, sendCounterTransaction } from "./counter-chain";
import { KITESCAN_EXPLORER_URL } from "./kite-network";
import { useWallet } from "./use-wallet";
import { playCounterClick } from "./utils/audioFeedback";
import "./index.css";

const transactionLabels = {
  signing: "Waiting for wallet confirmation",
  broadcast: "Broadcast · waiting for confirmation",
  confirmed: "Transaction confirmed",
  failed: "Transaction reverted on Kite Testnet",
  unconfirmed: "Confirmation unavailable. Check the original transaction on KiteScan before trying again.",
};

function App() {
  const walletConnection = useWallet();
  const { session } = walletConnection;
  const [count, setCount] = useState(null);
  const [lastRead, setLastRead] = useState(null);
  const [readError, setReadError] = useState("");
  const [isReading, setIsReading] = useState(true);
  const [transaction, setTransaction] = useState(null);
  const [transactionError, setTransactionError] = useState("");
  const [activities, setActivities] = useState([]);
  const [copiedHash, setCopiedHash] = useState(null);
  const reader = useRef(null);
  const readVersion = useRef(0);
  const writeLocked = useRef(false);
  const receiptWatching = useRef(false);

  const refreshCount = useCallback(async () => {
    const source = reader.current;
    if (!source) return;
    const version = ++readVersion.current;
    const isCurrent = () => reader.current === source && readVersion.current === version;
    setIsReading(true);
    setReadError("");
    try {
      const value = await source.readCount();
      if (isCurrent()) {
        setCount(value.toString());
        setLastRead(new Date());
      }
    } catch {
      if (isCurrent()) setReadError("Could not read the counter. Try syncing again.");
    } finally {
      if (isCurrent()) setIsReading(false);
    }
  }, []);

  useEffect(() => {
    const source = createCounterReader();
    reader.current = source;
    void refreshCount();
    return () => {
      reader.current = null;
      source.close();
    };
  }, [refreshCount]);

  const recordActivity = (entry) => {
    setActivities((previous) => [
      { ...entry, timestamp: new Date().toLocaleTimeString() },
      ...previous,
    ].slice(0, 10));
  };

  const finishReceipt = (entry, receipt) => {
    if (!receipt || ![0, 1].includes(receipt.status)) {
      setTransaction({ ...entry, status: "unconfirmed" });
      return;
    }
    const settled = { ...entry, status: receipt.status === 1 ? "confirmed" : "failed" };
    setTransaction(settled);
    recordActivity(settled);
    writeLocked.current = false;
    if (receipt.status === 1) {
      playCounterClick(1046.5, 0.25);
      void refreshCount();
    }
  };

  const watchReceipt = async (entry, wait) => {
    const source = reader.current;
    if (!source || receiptWatching.current) return;
    receiptWatching.current = true;
    setTransaction({ ...entry, status: "broadcast" });
    let receipt;
    try {
      receipt = await (wait ? source.waitForReceipt(entry.hash) : source.getReceipt(entry.hash));
    } catch {
      // A missing response does not establish whether a broadcast transaction succeeded.
    } finally {
      receiptWatching.current = false;
    }
    if (reader.current === source) finishReceipt(entry, receipt);
  };

  const performAction = async (action) => {
    if (!session || writeLocked.current) return;
    writeLocked.current = true;
    const type = action === "increment" ? "Increment" : "Decrement";
    setTransactionError("");
    setCopiedHash(null);
    setTransaction({ type, status: "signing" });
    let hash;
    try {
      hash = await sendCounterTransaction(session, action);
    } catch (error) {
      setTransaction(null);
      setTransactionError(error?.code === 4001
        ? "Transaction rejected in the wallet."
        : error?.message || "The wallet could not submit the transaction. Check its activity before retrying.");
      writeLocked.current = false;
      return;
    }
    await watchReceipt({ type, hash }, true);
  };

  const checkStatus = () => {
    if (transaction?.status === "unconfirmed") void watchReceipt(transaction, false);
  };

  const dismissUnconfirmed = () => {
    if (transaction?.status !== "unconfirmed" || receiptWatching.current) return;
    recordActivity(transaction);
    setTransaction(null);
    writeLocked.current = false;
  };

  const copyTxHash = async () => {
    const hash = transaction?.hash;
    if (!hash) return;
    try {
      await navigator.clipboard.writeText(hash);
      setCopiedHash(hash);
    } catch {
      setTransactionError("Unable to copy the transaction hash.");
    }
  };

  const txStatus = transaction?.status;
  const writeDisabled = !session || txStatus === "signing" || txStatus === "broadcast" || txStatus === "unconfirmed";

  return (
    <div className="min-h-screen flex flex-col items-center justify-between mainbg">
      <Header walletConnection={walletConnection} />
      <main className="flex flex-col items-center p-6 flex-1 w-full">
        <section aria-labelledby="counter-heading" className="bg-white shadow-lg rounded-lg w-full max-w-80 text-center mt-8">
          <div className="flex items-center justify-between border-gray-100 border-b px-5 py-3">
            <h2 id="counter-heading" className="text-2xl font-bold">Counter</h2>
            <button
              type="button"
              onClick={refreshCount}
              disabled={isReading}
              className="text-sm text-gray-600 hover:text-indigo-600 cursor-pointer disabled:opacity-50"
            >
              {isReading ? "Syncing…" : "Sync"}
            </button>
          </div>
          <p aria-live="polite" className="text-5xl break-all font-bold px-4 pt-8 text-gray-800">
            {count ?? (isReading ? "Loading…" : "Unavailable")}
          </p>
          <div className="px-4 pb-6 text-sm text-gray-600">
            {readError && <p role="alert" className="text-red-700">{readError}</p>}
            {lastRead && <p>Last read at <time dateTime={lastRead.toISOString()}>{lastRead.toLocaleTimeString()}</time></p>}
            {!session && <p>Read-only · Connect a wallet to make changes</p>}
          </div>
          <div className="flex justify-between gap-3 border-gray-100 border-t p-4">
            <button type="button" onClick={() => performAction("increment")} disabled={writeDisabled} className="btn-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
              +1
            </button>
            <button type="button" onClick={() => performAction("decrement")} disabled={writeDisabled} className="btn-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
              −1
            </button>
          </div>
          {transaction && (
            <div className="border-t border-gray-100 px-4 py-3 text-left text-sm">
              <p role="status">{transactionLabels[txStatus]}</p>
              {transaction.hash && (
                <div className="flex justify-between gap-2 mt-2">
                  <a href={`${KITESCAN_EXPLORER_URL}/tx/${transaction.hash}`} target="_blank" rel="noopener noreferrer" title={transaction.hash} className="text-blue-700 underline">
                    {transaction.hash.slice(0, 10)}…{transaction.hash.slice(-6)} on KiteScan
                  </a>
                  <button type="button" onClick={copyTxHash} className="text-gray-700 underline">
                    {copiedHash === transaction.hash ? "Copied!" : "Copy hash"}
                  </button>
                </div>
              )}
              {txStatus === "unconfirmed" && (
                <div className="flex flex-wrap gap-3 mt-2">
                  <button type="button" onClick={checkStatus} className="text-blue-700 underline">Check status</button>
                  <button type="button" onClick={dismissUnconfirmed} className="text-gray-700 underline">I checked KiteScan · continue</button>
                </div>
              )}
            </div>
          )}
          {transactionError && <p role="alert" className="px-4 pb-3 text-sm text-red-700">{transactionError}</p>}
        </section>
        {(session || activities.length > 0) && <ActivityFeed activities={activities} />}
      </main>
      <Footer />
    </div>
  );
}

export default App;
