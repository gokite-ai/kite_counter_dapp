import { useCallback, useEffect, useRef, useState } from "react";
import { KITE_TESTNET_PARAMS } from "./kite-network";
import {
  createRevisionGuard,
  findSavedWallet,
  getAnnouncedWallet,
  getWalletAccess,
  getWalletPreference,
  saveWalletPreference,
  selectKiteNetwork,
} from "./wallet-session";

const browserStorage = () => window.localStorage;

export function useWallet() {
  const [discovered, setDiscovered] = useState([]);
  const [legacy, setLegacy] = useState(null);
  const [session, setSession] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const guard = useRef(null);
  if (guard.current === null) guard.current = createRevisionGuard();
  const busy = useRef(false);
  const removeListeners = useRef(null);
  const restoredProvider = useRef(null);
  const wallets = discovered.length ? discovered : legacy ? [legacy] : [];

  const clearSession = useCallback((message = "") => {
    guard.current.invalidate();
    busy.current = false;
    removeListeners.current?.();
    removeListeners.current = null;
    saveWalletPreference(browserStorage, null);
    setSession(null);
    setConnecting(false);
    setError(message);
  }, []);

  useEffect(() => {
    function onAnnouncement(event) {
      const wallet = getAnnouncedWallet(event.detail);
      if (wallet) {
        setDiscovered((previous) => previous.some(({ id, provider }) => id === wallet.id || provider === wallet.provider)
          ? previous : [...previous, wallet]);
      }
    }
    function discoverWallets() {
      const provider = window.ethereum;
      if (typeof provider?.request === "function") {
        setLegacy((previous) => previous ?? { id: "legacy", key: "legacy", name: "Browser wallet", provider });
      }
      window.dispatchEvent(new Event("eip6963:requestProvider"));
    }

    window.addEventListener("eip6963:announceProvider", onAnnouncement);
    window.addEventListener("ethereum#initialized", discoverWallets);
    discoverWallets();
    return () => {
      window.removeEventListener("eip6963:announceProvider", onAnnouncement);
      window.removeEventListener("ethereum#initialized", discoverWallets);
      guard.current.invalidate();
      busy.current = false;
      removeListeners.current?.();
      removeListeners.current = null;
    };
  }, []);

  const connect = useCallback(async (wallet, preference) => {
    if (busy.current) return;
    const revision = guard.current.invalidate();
    const isCurrent = () => guard.current.isCurrent(revision);
    const { provider } = wallet;
    busy.current = true;
    setConnecting(true);
    setError("");
    try {
      if (!preference) {
        await provider.request({ method: "eth_requestAccounts" });
        if (!isCurrent()) return;
        const chainId = await provider.request({ method: "eth_chainId" });
        if (!isCurrent()) return;
        if (Number(chainId) !== Number(KITE_TESTNET_PARAMS.chainId)) {
          await selectKiteNetwork(provider, KITE_TESTNET_PARAMS);
        }
      }
      if (!isCurrent()) return;

      const onChange = () => clearSession("Wallet changed. Connect again to send transactions.");
      const events = ["accountsChanged", "chainChanged", "disconnect"];
      removeListeners.current = () => {
        for (const event of events) provider.removeListener?.(event, onChange);
      };
      for (const event of events) provider.on?.(event, onChange);

      const account = await getWalletAccess(provider, KITE_TESTNET_PARAMS.chainId);
      if (!isCurrent()) return;
      if (!account || (preference && preference.account !== account)) {
        clearSession(preference ? "" : "Select an account on Kite AI Testnet and try again.");
        return;
      }
      setSession({ ...wallet, account, isActive: isCurrent });
      saveWalletPreference(browserStorage, { key: wallet.key, account });
      return true;
    } catch (error) {
      if (isCurrent()) {
        removeListeners.current?.();
        removeListeners.current = null;
        if (!preference) {
          setError(error?.code === 4001
            ? "The request was declined in your wallet."
            : "Check that your wallet is unlocked and can switch to Kite AI Testnet.");
        }
      }
    } finally {
      if (isCurrent()) {
        busy.current = false;
        setConnecting(false);
      }
    }
  }, [clearSession]);

  useEffect(() => {
    if (session) return;
    // Give injected wallets time to announce before selecting a saved provider.
    const timer = window.setTimeout(() => {
      const preference = getWalletPreference(browserStorage);
      const wallet = findSavedWallet(discovered.length ? discovered : legacy ? [legacy] : [], preference);
      if (!wallet || busy.current || restoredProvider.current === wallet.provider) return;
      restoredProvider.current = wallet.provider;
      void connect(wallet, preference);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [connect, discovered, legacy, session]);

  return { wallets, session, connecting, error, connect, disconnect: clearSession };
}
