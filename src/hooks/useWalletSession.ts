import { useState, useEffect, useCallback } from 'react';

const SESSION_KEY = 'kite_counter_wallet_session';

export interface WalletSessionData {
  address: string;
  connectedAt: number;
}

export function useWalletSession() {
  const [session, setSession] = useState<WalletSessionData | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setSession(parsed);
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
  }, []);

  const saveSession = useCallback((address: string) => {
    const data: WalletSessionData = { address, connectedAt: Date.now() };
    setSession(data);
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  }, []);

  const clearSession = useCallback(() => {
    setSession(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  return { session, saveSession, clearSession };
}
