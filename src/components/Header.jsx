import PropTypes from "prop-types";
import logo from "../assets/network_logo.svg";
import WalletDialog from "./WalletDialog";

export default function Header({ walletConnection }) {
  return (
    <header className="headerwrap w-full bg-white px-3 py-4 sm:px-6 flex justify-between items-center gap-2 border-gray-200 border-b">
      <h1 className="logowrap"><img src={logo} alt="Kite Logo" />Counter Dapp</h1>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <a
          href="https://github.com/gokite-ai/kite_counter_dapp"
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-10 inline-flex items-center px-2 sm:px-3 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 text-sm font-medium"
        >
          GitHub
        </a>
        <WalletDialog {...walletConnection} />
      </div>
    </header>
  );
}

Header.propTypes = {
  walletConnection: PropTypes.shape(WalletDialog.propTypes).isRequired,
};
