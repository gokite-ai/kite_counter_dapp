import { Contract, FetchRequest, Interface, JsonRpcProvider, isHexString } from "ethers";
import counterAbi from "../abis/Counter.json" with { type: "json" };
import { KITE_TESTNET_CHAIN_ID, KITE_TESTNET_PARAMS } from "./kite-network.js";
import { getWalletAccess } from "./wallet-session.js";

export const counterAddress = "0x67924334CAC5f87ce009FF0568E01930a74A1aEA";
const abi = new Interface(counterAbi);

async function waitForReceipt(getReceipt, isClosed) {
  const deadline = Date.now() + 60_000;
  while (!isClosed() && Date.now() < deadline) {
    try {
      const receipt = await getReceipt();
      if (receipt) return receipt;
    } catch {
      // Transient RPC errors do not establish the transaction outcome.
    }
    const remaining = deadline - Date.now();
    if (remaining > 0 && !isClosed()) {
      await new Promise((resolve) => setTimeout(resolve, Math.min(3_000, remaining)));
    }
  }
  return null;
}

export function createCounterReader() {
  const request = new FetchRequest(KITE_TESTNET_PARAMS.rpcUrls[0]);
  request.timeout = 10_000;
  const provider = new JsonRpcProvider(request, KITE_TESTNET_CHAIN_ID);
  const counter = new Contract(counterAddress, abi, provider);
  let closed = false;
  return {
    readCount: () => counter.getCount(),
    waitForReceipt: (hash) => waitForReceipt(() => provider.getTransactionReceipt(hash), () => closed),
    getReceipt: (hash) => provider.getTransactionReceipt(hash),
    close: () => {
      closed = true;
      provider.destroy();
    },
  };
}

export async function sendCounterTransaction(session, action) {
  const { provider, account } = session;
  const activeAccount = await getWalletAccess(provider, KITE_TESTNET_PARAMS.chainId);
  if (!session.isActive() || activeAccount !== account) {
    throw new Error("Wallet account or network changed. Reconnect and try again.");
  }
  const hash = await provider.request({
    method: "eth_sendTransaction",
    params: [{ from: account, to: counterAddress, chainId: KITE_TESTNET_PARAMS.chainId, data: abi.encodeFunctionData(action), value: "0x0" }],
  });
  if (!isHexString(hash, 32)) throw new Error("The wallet did not return a transaction hash. Check its activity before retrying.");
  return hash;
}
