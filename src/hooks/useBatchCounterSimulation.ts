import { useState, useCallback, useMemo } from 'react';

export interface BatchStep {
  id: string;
  action: 'increment' | 'decrement' | 'reset';
  delta: number;
}

export interface SimulationResult {
  projectedCount: number;
  estimatedGasUnits: number;
  isValid: boolean;
  warnings: string[];
}

export function useBatchCounterSimulation(initialCount: number = 0) {
  const [steps, setSteps] = useState<BatchStep[]>([]);

  const addStep = useCallback((action: 'increment' | 'decrement' | 'reset', delta: number = 1) => {
    const newStep: BatchStep = {
      id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      action,
      delta: Math.max(1, Math.floor(delta)),
    };
    setSteps((prev) => [...prev, newStep]);
  }, []);

  const clearSteps = useCallback(() => setSteps([]), []);

  const simulation = useMemo<SimulationResult>(() => {
    let projected = initialCount;
    let gas = 21000;
    const warnings: string[] = [];

    for (const step of steps) {
      gas += 15000;
      if (step.action === 'increment') {
        projected += step.delta;
      } else if (step.action === 'decrement') {
        if (projected - step.delta < 0) {
          warnings.push(`Step ${step.id} causes underflow below zero`);
        }
        projected = Math.max(0, projected - step.delta);
      } else if (step.action === 'reset') {
        projected = 0;
        gas += 5000;
      }
    }

    return {
      projectedCount: projected,
      estimatedGasUnits: gas,
      isValid: warnings.length === 0,
      warnings,
    };
  }, [initialCount, steps]);

  return {
    steps,
    addStep,
    clearSteps,
    simulation,
  };
}

export default useBatchCounterSimulation;
