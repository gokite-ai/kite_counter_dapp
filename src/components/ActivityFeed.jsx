import PropTypes from "prop-types";

function ActivityFeed({ activities }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="w-80 mt-6 text-center text-xs text-gray-400 bg-white/60 p-4 rounded-lg border border-gray-100 shadow-sm">
        No transactions yet in this session
      </div>
    );
  }

  return (
    <div className="w-80 mt-6 bg-white rounded-lg shadow-sm border border-gray-100 p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Recent Activity
        </h3>
        <span className="text-xs text-gray-400">{activities.length} txs</span>
      </div>
      <div className="space-y-2">
        {activities.map((item, index) => (
          <div
            key={item.hash || index}
            className="flex items-center justify-between text-xs py-1.5 px-2 bg-gray-50 hover:bg-gray-100 rounded transition-colors"
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  item.type === "Increment" ? "bg-emerald-500" : "bg-blue-500"
                }`}
              />
              <span className="font-medium text-gray-700">{item.type}</span>
              <span className="text-[10px] text-gray-400">{item.timestamp}</span>
            </div>
            {item.hash && (
              <a
                href={`https://testnet.kitescan.ai/tx/${item.hash}`}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 hover:text-indigo-800 font-mono text-[11px] underline"
                title="View on KiteScan"
              >
                {`${item.hash.slice(0, 6)}...${item.hash.slice(-4)}`}
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

ActivityFeed.propTypes = {
  activities: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string.isRequired,
      hash: PropTypes.string,
      timestamp: PropTypes.string.isRequired,
    })
  ),
};

export default ActivityFeed;
