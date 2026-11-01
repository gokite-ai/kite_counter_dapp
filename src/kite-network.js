export const KITE_TESTNET_CHAIN_ID = 2368;
export const KITESCAN_EXPLORER_URL = "https://testnet.kitescan.ai";

export const KITE_TESTNET_PARAMS = {
  chainId: `0x${KITE_TESTNET_CHAIN_ID.toString(16)}`,
  chainName: "Kite AI Testnet",
  nativeCurrency: { name: "KITE", symbol: "KITE", decimals: 18 },
  rpcUrls: ["https://rpc-testnet.gokite.ai/"],
  blockExplorerUrls: [`${KITESCAN_EXPLORER_URL}/`],
};
