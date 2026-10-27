import PropTypes from "prop-types";

function StepSelector({ step, onSelectStep, disabled }) {
  const options = [1, 5, 10];

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-50/80 rounded-lg border border-gray-100 mb-3">
      <span className="text-xs text-gray-500 font-medium tracking-wide">
        Step Multiplier
      </span>
      <div className="inline-flex p-0.5 bg-gray-200/60 rounded-md" role="group">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            disabled={disabled}
            onClick={() => onSelectStep(opt)}
            className={`px-2.5 py-1 text-xs font-semibold rounded transition-all duration-150 cursor-pointer ${
              step === opt
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            ±{opt}
          </button>
        ))}
      </div>
    </div>
  );
}

StepSelector.propTypes = {
  step: PropTypes.number.isRequired,
  onSelectStep: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default StepSelector;
