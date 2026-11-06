export interface GasEstimateInput {
  baseFeePerGas: bigint;
  maxPriorityFeePerGas?: bigint;
  bufferMultiplier?: number;
}

export interface GasEstimateOutput {
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  suggestedGasLimit: bigint;
  formattedMaxGwei: string;
}

export function estimateEip1559Gas(
  input: GasEstimateInput,
  estimatedUnits: bigint = BigInt(50000)
): GasEstimateOutput {
  const priorityFee = input.maxPriorityFeePerGas || BigInt(1500000000); // 1.5 Gwei default
  const multiplier = input.bufferMultiplier || 1.15;

  const bufferedBase = BigInt(Math.ceil(Number(input.baseFeePerGas) * multiplier));
  const maxFee = bufferedBase + priorityFee;
  const gasLimit = BigInt(Math.ceil(Number(estimatedUnits) * 1.2));

  const formattedMaxGwei = (Number(maxFee) / 1e9).toFixed(4);

  return {
    maxFeePerGas: maxFee,
    maxPriorityFeePerGas: priorityFee,
    suggestedGasLimit: gasLimit,
    formattedMaxGwei,
  };
}

export default estimateEip1559Gas;
