# Kite AI - Counter Dapp (For Development purposes only)

Kite AI - Counter Dapp is a decentralized application (dApp) built with **Kite AI chain**, **React Vite**, **Tailwind CSS**, and **Ethers.js**. A blockchain-integrated counter.

## Features

- **Counter Functionality**: A decentralized counter stored on the blockchain.
- **Ethereum Integration**: Uses Ethers.js to interact with smart contracts.
- **Wallet selection and restore**: Choose an EIP-6963 wallet or connect a legacy browser wallet. On reload, the app checks the saved wallet’s authorized account and network before restoring the connection.
- **Fast & Responsive UI**: Styled with Tailwind CSS for a seamless experience.
- **Optimized Performance**: Built with Vite for rapid development and loading speed.

## Tech Stack

- **Frontend**: React + Vite
- **Styling**: Tailwind CSS
- **Blockchain Integration**: Ethers.js
- **Smart Contracts**: Solidity
- **Block chain**: Kite AI (Testnet)

## Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/gokite-ai/kite_counter_dapp
   cd kite_counter_dapp
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start the development server:
   ```sh
   npm run dev
   ```

## Usage

- Open the app to read the shared Counter on Kite Testnet. Use **Sync** to fetch a fresh value.
- To write, open **Connect wallet** in the top-right corner, select an installed wallet and approve the connection in its extension. The dialog then shows the wallet and account on Kite Testnet or the reason the connection could not be completed. Reopen the connected wallet button to copy the address or disconnect.
- Use testnet KITE for gas. Select **+1** or **−1** and review the transaction in your wallet.
- After broadcasting, use the transaction link to check the result on KiteScan.

## Fixes and PR verification

This change builds on [PR #38](https://github.com/gokite-ai/kite_counter_dapp/pull/38) and uses the existing Kite Testnet Counter contract and ABI.

| Fix | How to verify |
| --- | --- |
| Wallet discovery and connection are in the header dialog | Open **Connect wallet** in the top-right corner. With two EIP-6963 wallets, select the second and confirm only that wallet requests access. Verify the approval step and success result. Decline a request and confirm the dialog shows the failure and a way back to the list. A legacy-only wallet appears as **Browser wallet**. The picker displays embedded extension icons and uses the generic wallet icon when artwork is unavailable or invalid. |
| Refresh can restore a verified wallet session | Connect on Kite Testnet and refresh. The same wallet and account should return without another prompt. Disconnect and refresh again. The app should stay disconnected. Changing the selected network or account clears write access. |
| Counter buttons match what the contract executes | Connect a wallet and select **+1** or **−1**. Each click should produce a single wallet request for the corresponding `increment()` or `decrement()` method. |
| A submitted transaction can be tracked immediately | The app shows the wallet prompt stage, the broadcast hash and KiteScan link, then the receipt status. If a receipt is unavailable after the wait, check the existing hash before allowing another write. Check reverted and confirmed receipts separately. |
| Counter reads work without a wallet | Open the app in a browser profile without wallet extensions. Verify that the counter and last successful read time appear and the write buttons are disabled. Disconnect the network or block the RPC, then try **Sync**. The previous value and read time should remain visible alongside the error. |

Run the local checks before submitting:

```sh
npm run lint
node --test src/wallet-session.test.js
npm run build
```

Local verification passed for lint, the production build, and eight wallet-session tests. Chrome verification with simulated wallets and receipts covered the header dialog on mobile, wallet selection, approval, refusal and retry, keyboard dismissal, silent restore, both single-step calls, broadcast tracking, timeout recovery, and reverted transactions. The no-wallet count also loaded from the real Kite Testnet RPC in Chrome. Wallet-extension signing and real testnet write transactions are pending manual verification.

Counter state is shared with other users. Use the wallet request and KiteScan receipt to verify the transaction method and result. Activity is kept for the current page, so save the KiteScan link if you intend to reload while a transaction is pending.

## KiteAI Testnet network settings

- Chain Name: KiteAI Testnet  
- Default RPC URL: [https://rpc-testnet.gokite.ai/](https://rpc-testnet.gokite.ai/)  
- Chain ID: 2368  
- Token: KITE  
- Block Explorer URL: [https://testnet.kitescan.ai/](https://testnet.kitescan.ai/)  

## KiteAI Testnet Faucet

Use the link below to get KITE and USDT tokens on testnet
- [KiteAI testnet Faucet](https://faucet.gokite.ai/)

## **Contributing**

We welcome contributions from the community to improve and expand the **Kite AI - Counter Dapp**. Follow the steps below to contribute effectively.

### **How to Contribute**
1. Fork the Repository – Create a copy of the repository under your GitHub account.  
2. Create a New Branch – Work on a separate branch for each new feature or fix.  
3. Make Your Changes – Ensure your code follows project structure and best practices.  
4. Commit and Push** – Write clear commit messages and push your changes.  
5. Submit a Pull Request (PR) – Open a PR to merge your changes into the `main` branch.  

### **Guidelines**
- Follow the project's code style and branching strategy.  
- Ensure new features work correctly and do not break existing functionality.  
- Write clear and descriptive commit messages.  
- Open an Issue for bug reports, improvements, or feature suggestions.  

Thank you for contributing to Kite AI - 🪁 
