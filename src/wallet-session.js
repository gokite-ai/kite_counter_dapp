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

const storageKey = "kite-counter.wallet";

export function getAnnouncedWallet(detail) {
  const { info, provider } = detail ?? {};
  if (!info || typeof provider?.request !== "function") return null;
  const { uuid, name, rdns, icon } = info;
  if (typeof uuid !== "string" || !uuid || typeof name !== "string" || !name.trim() ||
      typeof rdns !== "string" || !rdns) return null;
  // Wallet artwork is untrusted. Load only bounded, self-contained images.
  const embeddedIcon = typeof icon === "string" && icon.length <= 128 * 1024 && (
    /^data:image\/(?:png|jpeg|webp|svg\+xml);base64,[a-z0-9+/]+={0,2}$/i.test(icon) ||
    /^data:image\/svg\+xml(?:;charset=utf-8)?,%3c/i.test(icon)
  );
  return { id: uuid, name, key: "eip6963:" + rdns, provider, icon: embeddedIcon ? icon : null };
}

export function findSavedWallet(wallets, preference) {
  if (!preference) return null;
  const matches = wallets.filter((wallet) => wallet.key === preference.key);
  return matches.length === 1 ? matches[0] : null;
}

export function getWalletPreference(storage) {
  try {
    const preference = JSON.parse(storage().getItem(storageKey));
    return typeof preference?.key === "string" && typeof preference?.account === "string" ? preference : null;
  } catch {
    return null;
  }
}

export function saveWalletPreference(storage, preference) {
  try {
    if (preference) storage().setItem(storageKey, JSON.stringify(preference));
    else storage().removeItem(storageKey);
  } catch {
    // Wallet connection still works when storage is blocked.
  }
}

export async function getWalletAccess(provider, chainId) {
  const [accounts, network] = await Promise.all([
    provider.request({ method: "eth_accounts" }),
    provider.request({ method: "eth_chainId" }),
  ]);
  const account = accounts?.[0];
  if (Number(network) !== Number(chainId) || typeof account !== "string" ||
      !/^0x[0-9a-f]{40}$/i.test(account)) return null;
  return account.toLowerCase();
}
