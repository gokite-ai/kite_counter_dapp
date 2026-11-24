import { useRef, useState } from "react";
import PropTypes from "prop-types";
import "./wallet-dialog.css";

const steps = ["Select", "Approve", "Result"];
const titles = ["Connect a wallet", "Approve connection", "Connection result"];
const walletShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  icon: PropTypes.string,
});

function WalletIcon({ icon }) {
  const [failedIcon, setFailedIcon] = useState(null);
  return (
    <span className="wallet-icon" aria-hidden="true">
      {icon && icon !== failedIcon
        ? <img alt="" src={icon} onError={() => setFailedIcon(icon)} />
        : <span className="wallet-glyph" />}
    </span>
  );
}

WalletIcon.propTypes = { icon: PropTypes.string };

export default function WalletDialog({ wallets, session, connecting, error, connect, disconnect }) {
  const dialog = useRef(null);
  const [selected, setSelected] = useState(null);
  const [copyStatus, setCopyStatus] = useState("");
  const account = session?.account;
  const failed = Boolean(selected && error && !connecting && !account);
  const step = account || failed ? 2 : connecting ? 1 : 0;

  function openDialog() {
    setCopyStatus("");
    dialog.current.showModal();
  }

  async function chooseWallet(wallet) {
    setSelected(wallet);
    if (await connect(wallet)) setSelected(null);
  }

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(account);
      setCopyStatus("Address copied.");
    } catch {
      setCopyStatus("Could not copy the address.");
    }
  }

  return (
    <>
      <button
        type="button"
        className="wallet-trigger"
        aria-haspopup="dialog"
        aria-label={account ? "Connected wallet" : "Connect wallet"}
        onClick={openDialog}
      >
        {account
          ? <span className="wallet-connected-dot" aria-hidden="true" />
          : <span className="wallet-glyph" aria-hidden="true" />}
        {account ? `${account.slice(0, 6)}…${account.slice(-4)}` : connecting ? "Connecting…" : "Connect wallet"}
      </button>
      <dialog ref={dialog} className="wallet-dialog" aria-labelledby="wallet-dialog-title">
        <div className="wallet-dialog-heading">
          <h2 id="wallet-dialog-title">{titles[step]}</h2>
          <form method="dialog">
            <button type="submit" className="wallet-dialog-close" aria-label="Close wallet dialog"><span className="wallet-close-glyph" aria-hidden="true" /></button>
          </form>
        </div>
        <ol className="wallet-steps" aria-label="Wallet connection progress">
          {steps.map((label, index) => (
            <li key={label} data-complete={index < step} aria-current={index === step ? "step" : undefined}>
              <span className="wallet-step-dot" aria-hidden="true" />
              {label}
            </li>
          ))}
        </ol>
        {step === 0 && (
          <>
            {!selected && error && <p role="alert" className="wallet-feedback wallet-error">{error}</p>}
            {wallets.length > 0 ? (
              <div className="wallet-options" aria-label="Installed wallets">
                {wallets.map((wallet) => (
                  <button key={wallet.id} type="button" className="wallet-option" onClick={() => chooseWallet(wallet)}>
                    <WalletIcon icon={wallet.icon} />
                    <span className="wallet-option-name">{wallet.name}</span>
                    <span className="wallet-option-arrow" aria-hidden="true" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="wallet-panel wallet-empty">
                <WalletIcon />
                <strong>No browser wallets detected</strong>
                <p>Install or unlock an EVM wallet, then reopen this dialog.</p>
              </div>
            )}
          </>
        )}
        {step === 1 && (
          <div className="wallet-panel" role="status">
            <span className="wallet-approval-icon">
              <WalletIcon icon={selected?.icon} />
              <span className="wallet-spinner" aria-hidden="true" />
            </span>
            <strong>{selected ? `Waiting for ${selected.name}` : "Restoring wallet connection"}</strong>
            <p>{selected ? "Approve the request in your wallet. If the prompt is hidden, open the wallet extension." : "Checking the wallet’s active account and network."}</p>
          </div>
        )}
        {account && (
          <div className="wallet-panel">
            <div role="status" className="wallet-result">
              <span className="wallet-result-icon wallet-result-success" aria-hidden="true">
                <span className="wallet-check-glyph" />
              </span>
              <strong>{session.name} connected</strong>
              <p className="wallet-network">Kite AI Testnet</p>
            </div>
            <code className="wallet-address">{account}</code>
            <div className="wallet-actions">
              <button type="button" className="wallet-quiet-button" onClick={copyAddress}>Copy address</button>
              <button
                type="button"
                className="wallet-quiet-button"
                onClick={() => {
                  setSelected(null);
                  setCopyStatus("");
                  disconnect();
                  dialog.current.close();
                }}
              >
                Disconnect
              </button>
              <form method="dialog">
                <button type="submit" className="wallet-trigger">Done</button>
              </form>
            </div>
            {copyStatus && <p role="status">{copyStatus}</p>}
          </div>
        )}
        {failed && (
          <div className="wallet-panel">
            <div role="alert" className="wallet-result">
              <span className="wallet-result-icon wallet-result-error" aria-hidden="true">
                <span className="wallet-close-glyph" />
              </span>
              <strong>Could not connect to {selected.name}</strong>
              <p className="wallet-error">{error}</p>
            </div>
            <button type="button" className="wallet-quiet-button" onClick={() => setSelected(null)}>Back to wallets</button>
          </div>
        )}
      </dialog>
    </>
  );
}

WalletDialog.propTypes = {
  wallets: PropTypes.arrayOf(walletShape).isRequired,
  session: PropTypes.shape({ account: PropTypes.string.isRequired, name: PropTypes.string.isRequired }),
  connecting: PropTypes.bool.isRequired,
  error: PropTypes.string.isRequired,
  connect: PropTypes.func.isRequired,
  disconnect: PropTypes.func.isRequired,
};
