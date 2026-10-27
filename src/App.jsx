import { useState } from "react";
import { ethers } from "ethers";

import Header from "./components/Header";
import Footer from "./components/Footer";
import StepSelector from "./components/StepSelector";
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
  const [step, setStep] = useState(1);
  const [isPending, setIsPending] = useState(false);

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

function parseContractError(err, action = "Transaction") {
  if (err?.code === 4001 || err?.code === "ACTION_REJECTED") {
    return "Transaction request was canceled in your wallet.";
  }
  if (
    err?.code === "INSUFFICIENT_FUNDS" ||
    err?.message?.includes("insufficient funds")
  ) {
    return "Insufficient KITE for gas. Please claim tokens from the testnet faucet.";
  }
  return err?.shortMessage || err?.message || `${action} failed.`;
}

  const increment = async () => {
    if (!contract) return;
    try {
      const tx = await contract.increment();
      await tx.wait();
      const updatedCount = await contract.getCount();
      setCount(updatedCount.toString());
      setError("");
    } catch (err) {
      setError(parseContractError(err, "Increment transaction"));
    }
  };

  const decrement = async () => {
    if (!contract) return;
    try {
      const tx = await contract.decrement();
      await tx.wait();
      const updatedCount = await contract.getCount();
      setCount(updatedCount.toString());
      setError("");
    } catch (err) {
      setError(parseContractError(err, "Decrement transaction"));
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between mainbg">
      <Header wallet={wallet} />
      <div className="flex flex-col items-center p-6 flex-1 w-full">
        {error && (
          <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm mb-4 max-w-md w-full">
            <span>{error}</span>
            <button
              onClick={() => setError("")}
              className="text-red-400 hover:text-red-700 font-bold ml-2 cursor-pointer text-base"
              title="Dismiss error"
            >
              &times;
            </button>
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
          <div className="bg-white shadow-lg rounded-lg w-80 text-center mt-32 p-4">
            <h2 className="text-2xl font-bold mb-3 border-gray-100 border-b pb-3">
              Counter
            </h2>
            <p className="text-7xl font-bold text-gray-800 mb-4 py-6">
              {count !== null ? count : "Loading..."}
            </p>

            <StepSelector
              step={step}
              onSelectStep={setStep}
              disabled={isPending}
            />

            <div className="flex justify-between gap-3 border-gray-100 border-t pt-4">
              <button
                onClick={() => executeAction(true)}
                disabled={isPending}
                className="btn-primary cursor-pointer flex-1 disabled:opacity-50"
              >
                {isPending ? "Executing..." : `Increment (+${step})`}
              </button>
              <button
                onClick={() => executeAction(false)}
                disabled={isPending}
                className="btn-primary cursor-pointer flex-1 disabled:opacity-50"
              >
                {isPending ? "Executing..." : `Decrement (-${step})`}
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
