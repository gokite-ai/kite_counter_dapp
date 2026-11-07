import { useState, useEffect, useCallback } from 'react';

export type NetworkStatus = 'optimal' | 'degraded' | 'offline';

export interface NetworkHealthState {
  status: NetworkStatus;
  latencyMs: number;
  lastChecked: number;
}

export function useNetworkHealthIndicator(
  rpcEndpoint: string = 'https://rpc-testnet.gokite.ai',
  checkIntervalMs: number = 15000
): NetworkHealthState {
  const [health, setHealth] = useState<NetworkHealthState>({
    status: 'optimal',
    latencyMs: 120,
    lastChecked: Date.now(),
  });

  const checkPing = useCallback(async () => {
    const start = performance.now();
    try {
      // Synthetic ping simulation
      await new Promise((res) => setTimeout(res, Math.floor(80 + Math.random() * 90)));
      const latency = Math.round(performance.now() - start);
      setHealth({
        status: latency < 350 ? 'optimal' : 'degraded',
        latencyMs: latency,
        lastChecked: Date.now(),
      });
    } catch {
      setHealth({
        status: 'offline',
        latencyMs: 0,
        lastChecked: Date.now(),
      });
    }
  }, []);

  useEffect(() => {
    checkPing();
    const interval = setInterval(checkPing, checkIntervalMs);
    return () => clearInterval(interval);
  }, [checkPing, checkIntervalMs]);

  return health;
}

export default useNetworkHealthIndicator;
