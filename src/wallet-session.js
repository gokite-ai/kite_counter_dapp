// One monotonically increasing revision invalidates asynchronous work after a
// wallet change or a newer counter operation.
export function createRevisionGuard() {
  let revision = 0;
  return {
    capture: () => revision,
    invalidate: () => ++revision,
    isCurrent: (captured) => captured === revision,
  };
}

// EIP-3085 does not promise that adding a chain selects it.
export async function selectKiteNetwork(ethereum, params) {
  const switchChain = () => ethereum.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: params.chainId }],
  });
  try {
    await switchChain();
  } catch (error) {
    if (error?.code !== 4902) throw error;
    await ethereum.request({ method: 'wallet_addEthereumChain', params: [params] });
    await switchChain();
  }
  const selected = await ethereum.request({ method: 'eth_chainId' });
  if (Number(selected) !== Number(params.chainId)) {
    throw new Error('Kite AI Testnet was not selected.');
  }
}

// A stale connection must never release the current authorization flag.
export const mayFinishAuthorization = (attempt, activeAttempt) => attempt === activeAttempt;
